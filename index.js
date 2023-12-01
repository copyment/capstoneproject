const express = require('express')
const mongoose=require("mongoose")
const cookieParser = require("cookie-parser");
var session = require("express-session");
const app = express()
var path = require("path")
const {User, MessageModel, Book, RequestModel, BookMark, Circulation} = require ("./mongodb");
const multer = require("multer");
const sharp = require('sharp');
const {format} = require("date-fns");
const hbs = require('hbs');
const fs = require('fs');


hbs.registerHelper('eq', function (a, b) {
    return a === b;
});

const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024},
});

app.locals.resizeImage = (image) => {
    const resizedImage = sharp(Buffer.from(image, 'base64'))
        .resize({ width: 300 }) 
        .toBuffer();
    return `data:image/jpeg;base64,${resizedImage.toString('base64')}`;
};

const tempelatePath=path.join(__dirname,'Pages')
app.use(cookieParser());
app.use(express.json());
app.use(express.static('Pages'));
app.use(express.static('imgs'));
app.use(express.static('csss'));
app.use(express.static('font'));
app.use(express.static('jss'));
app.use(express.static('LOGO'));
app.use(express.static('load'));
app.use(express.json({ limit: '50mb' }))
app.set("view engine", "hbs")
app.set("views", tempelatePath)
app.use(session({
    secret: "lsmkey",
    resave: false,
    saveUninitialized: true
}));
app.use(express.urlencoded({ limit: '50mb', extended:false}))

// TO ACCESS OR OPEN THE PAGES S
app.get("/", (req,res)=>{
    res.render("FRONT")
})

app.get("/signup", (req,res)=>{
    res.render("signup")
})

app.get("/login", (req,res)=>{
    res.render("login")
})

// HOME PAGE S
app.get("/home", async (req,res) => {
    try {
        const mostBorrowedCallNumber = await Circulation.aggregate([
            {
                $group: {
                    _id: "$CallNumber",
                    totalBorrowCount: { $sum: 1 }
                }
            },
            {
                $sort: { totalBorrowCount: -1 }
            },
            {
                $limit: 1
            }
        ]);
        if (mostBorrowedCallNumber.length === 0) {
            throw new Error("No books found");
        }
        const mostBorrowedBookCallNumber = mostBorrowedCallNumber[0]._id;
        // Fetch the book details based on the CallNumber from the Book collection
        const mostBorrowedBook = await Book.findOne({ CallNumber: mostBorrowedBookCallNumber });
        const userId = req.session.user._id; // Adjust based on your user object structure
        const recentUserActivity = await Circulation.find({ BorrowerMemberID: userId })
            .sort({ 'IssueDate': -1 }) // Sort in descending order based on IssueDate
            .limit(4);
        const latestBooks = await Book.find()
        .sort({ DateCatalog: -1 })
        .limit(4);
        const randomBooks = await Book.aggregate([
            {$sample: { size: 4 }}
        ]);
        const topBooks = mostBorrowedBook ? [mostBorrowedBook] : [];
        const recentUserActivityDetails = await Promise.all(recentUserActivity.map(async (circulation) => {
            // Fetch the associated book information from the Book collection using the CallNumber
            const book = await Book.findOne({ CallNumber: circulation.CallNumber });
            return {
                circulation,
                book,
            };
        }));
        res.render("home", {latestBooks, randomBooks, topBooks, recentUserActivity: recentUserActivityDetails});
    } catch (error){
        console.error("Error:", error);
        res.status(500).send("Error occured.")
    }
});
// HOME PAGE E

// PROFILE PAGE S
app.get("/profile", (req, res) => {
    const user = req.session.user;
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    console.log("User.DateRegistered (Before):", user.DateRegistered);
    console.log("tzOffset:", tzOffset);
    const dateRegistered = new Date(user.DateRegistered);
    const formattedRegistrationDate = format(
        dateRegistered, 
        "MMMM dd, yyyy, hh:mm a"
    );
    console.log("Formatted Registration Date (After):", formattedRegistrationDate);
    res.render("profile", { user, formattedRegistrationDate });
});
// PROFILE PAGE E

// FRONT PAGE S
app.get("/FRONT", (req,res)=>{
    res.render("FRONT")
})
// FRONT PAGE E

// LOG OUT S
app.get("/logout", (req,res)=>{
    req.session.destroy();
    res.render("FRONT");
})
// LOG OUT E

// ITEM PAGE S
app.get("/item", async (req, res) => {
    try {
        const bookId = req.query.bookId;
        const book = await Book.findById(bookId); 
        if (!book) {
            return res.status(404).send("Book not found");
        }
        const itemsCopiesCollection = mongoose.connection.collection("itemscopies");
        const filter = {
            CallNumber: book.CallNumber,
            CirculationStatus: "Available"
        };
        const count = await itemsCopiesCollection.countDocuments(filter);
        res.render("item", {book, user: req.session.user, availableCopiesCount: count}); 
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while retrieving the book");
    }
});
// ITEM PAGE E

// BOOK COLLECTION PAGE S
app.get("/bcollection", async (req, res) => {
    try {
        let books;
        const sortOption = req.query.sortOption || "default"; 
        const accountType = req.session.user.AccountType; 
        switch (accountType) {
            case "Student":
                books = await Book.find({ AccessLevel: "Open Access" });
                break;
            case "Faculty":
                books = await Book.find();
                break;
            default:
                books = await Book.find();
        }
        switch (sortOption) {
            case "a-z":
                books = books.sort((a, b) => a.Title.localeCompare(b.Title));
                break;
            case "latest":
                books = books.sort((a, b) => b.DateCatalog.localeCompare(a.DateCatalog));
                break;
            case "oldest":
                books = books.sort((a, b) => a.DateCatalog.localeCompare(b.DateCatalog));
                break;
            // Add more sorting options as needed
        }
        const groupedBooks = groupBooksIntoRows(books, 4);
        res.render("bcollection", { groupedBooks });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while retrieving books");
    }
});
function groupBooksIntoRows(books, count){
    const grouped = [];
    for (let i = 0; i < books.length; i += count) {
        grouped.push(books.slice(i, i + count));
    }
    return grouped;
}
//BOOK COLLECTION PAGE E

//MY BORROW PAGE S
app.get("/myborrow", async (req, res) => {
    try {
        const userId = req.session.user._id;
        const borrowBooks = await Circulation.find({
            BorrowerMemberID: userId,
            $or: [{ CirculationStatus: "Returned" }, { CirculationStatus: "Borrowed" }]
        });
        for (const book of borrowBooks) {
            const item = await Book.findOne({ CallNumber: book.CallNumber });
            book.Image = item.ItemImage;
            book.Author = item.CreatorAuthor;
        }
        console.log("Reserved Books:", borrowBooks);
        res.render("myborrow", { borrowBooks });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while fetching reserved books");
    }
});
//MY BORROW PAGE E

//MY RESERVED PAGE S
app.get("/myreserved", async (req, res) => {
    try {
        const userId = req.session.user._id;
        const reservedBooks = await RequestModel.find({
            MemberId: userId,
            $or: [{ RequestStatus: "Pending" }, { RequestStatus: "Approved" }]
        });
        for (const book of reservedBooks) {
            const item = await Book.findOne({ CallNumber: book.CallNumber });
            book.Image = item.ItemImage;
            book.Author = item.CreatorAuthor;
        }
        console.log("Reserved Books:", reservedBooks);
        res.render("myreserved", { reservedBooks });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while fetching reserved books");
    }
});
//MY RESERVED PAGE E

//MY TRANSACTION PAGE S
app.get("/mytransaction", async (req, res) => {
    try {
        const userId = req.session.user._id;
        const reservedBooks = await RequestModel.find({
            MemberId: userId,
            $or: [{ RequestStatus: "Completed" }, { RequestStatus: "Cancelled" }, { RequestStatus: "Declined" }]
        });
        for (const book of reservedBooks) {
            const item = await Book.findOne({ CallNumber: book.CallNumber });
            book.Image = item.ItemImage;
            book.Author = item.CreatorAuthor;
        }
        console.log("Reserved Books:", reservedBooks);
        res.render("mytransaction", { reservedBooks });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while fetching reserved books");
    }
});
//MY TRANSACTION PAGE E

//SIGN UP S
app.post("/signup", upload.single("profilePicture"),async (req,res)=>{
try {
    const idNumber = req.body.idnumber;
    const contact = req.body.contact;
    const email = req.body.email;
    const rfid = req.body.rfid;
    const usern = req.body.username;
    const existingContact = await User.findOne({ ContactNumber: contact });
    const existingEmail = await User.findOne({ Email: email });
    const existingRfid = await User.findOne({ Rfid: rfid });
    const existingUsern = await User.findOne({ Username: usern });
    if (existingContact) {
        return res.render("signup", {errorMessage: "Contact Number already exist. Please try another!"});
    }
    if (existingEmail) {
        return res.render("signup", {errorMessage: "Email already exist. Please try another!"});
    }
    if (existingRfid) {
        return res.render("signup", {errorMessage: "RFID already exist. Please try another!"});
    }
    if (existingUsern) {
        return res.render("signup", {errorMessage: "Username already exist. Please try another!"});
    }
    const data={
    Fullname:req.body.fullname,
    Age:req.body.age,
    Birthday:req.body.birthday,
    Username:req.body.username,
    Password:req.body.password,
    ContactNumber:req.body.contact,
    IDNumber:req.body.idnumber,
    Address:req.body.address,
    Email:req.body.email,
    Rfid:req.body.rfid,
    AccountType:req.body.account,
    Status: req.body.status,
};
const defaultPicturePath = "./Pages/imgs/picture.jpg";

    // Initialize ProfilePicture with the default value
    data.ProfilePicture = await getDefaultProfilePictureBase64(defaultPicturePath);

//const tzOffset = new Date().getTimezoneOffset() * 60000; // Get the current system timezone offset
const currentDate = new Date(); 
const formattedDate = currentDate.toISOString();
data.DateRegistered = formattedDate;
//const tzOffset = new Date().getTimezoneOffset() * 60000; 
//const currentDate = new Date(Date.now() - tzOffset); 
//const formattedDate = format(currentDate, "MMMM dd, yyyy, hh:mm a", { timeZone: 'Asia/Manila' });
//data.DateRegistered = formattedDate;
if (req.file){
    const profilePictureBuffer = await sharp (req.file.buffer)
    .resize({ width: 100, height: 100 }) 
    .jpeg({ quality: 50 }) 
    .toBuffer();
    const profilePictureBase64 = profilePictureBuffer.toString("base64");
    data.ProfilePicture = profilePictureBase64;
    const imageSizeInBytes = Buffer.from(profilePictureBase64, 'base64').length;
        if (imageSizeInBytes > 5120) {
            return res.render('signup', { errorMessage: 'Image size exceeds 5KB. Please choose a smaller image.' });
        }
}
const newUser = new User(data);
await newUser.save();
res.render("login");
} catch (error) {
    console.error("Error:", error);
    res.send("error occured while saving the message");
}
});

async function getDefaultProfilePictureBase64(filePath) {
    try {
      const defaultPictureBuffer = fs.readFileSync(filePath);
      const defaultPictureBase64 = defaultPictureBuffer.toString('base64');
      return defaultPictureBase64;
    } catch (error) {
      console.error("Error reading default profile picture:", error);
      return ''; // Return an empty string or handle the error accordingly
    }
  }
//SIGN UP E

//MESSAGE S
app.post("/submitmessage",async (req,res)=>{
    const messageData={
        name:req.body.name,
        email:req.body.email,
        phone:req.body.phone,
        message:req.body.message
    };
    try {
    const newMessage = new MessageModel(messageData);
    await newMessage.save();
    res.render("FRONT");
    } catch (error) {
        console.error("Error:", error);
        res.send("error occured while saving the message");
    }
    });
// MESSAGE E

// LOG IN S
app.post("/login", async (req, res) => {
    try {
        const check = await User.find({Username: req.body.username});

        if (check.length > 0 && check[0].Password === req.body.password) {
            const user = check[0];

            if (user.Status === 3) {
                // Account is banned
                return res.render("login", { errorMessage: "Account Banned" });
            }
            req.session.user = user;
            return res.redirect("/home");
        } else {
            // Incorrect username or password
            return res.render("login", { errorMessage: "Unknown Account" });
        }
    } catch (error) {
        console.error("error during login:", error)
        return res.status(500).json({ errorMessage: "An error occurred. Please try again later." });
    }
});
// LOG IN E

// REQUEST S --------------------------------------->>>>>>>>>
app.post("/request", async (req, res) => {
    try {
        const userId = req.body.userId;
        const name = req.body.fullname;
        const idNumber = req.body.idNumber;
        const title = req.body.title;
        const callNumber = req.body.callNumber;
        const requestStatus = req.body.requestStatus;
        const edition = req.body.edition;
        const access = req.body.access;
        const assest = req.body.assest;
        const memberType = req.body.memberType;
        const sent = req.body.sent;
        const accountType = req.session.user.AccountType; // Assuming user information is stored in the session
        const maxRequests = accountType === "Student" ? 2 : 10; // Set maximum requests based on account type
        // Check if the user has reached the maximum allowed requests
        const existingRequests = await RequestModel.countDocuments({
            MemberId: userId,
            RequestStatus: "Pending",
        });
        if (existingRequests >= maxRequests) {
            return res.status(400).json({ message: "Maximum request limit reached." });
        }
        const existingRequest = await RequestModel.findOne({
            MemberId: userId,
            CallNumber: callNumber,
            RequestStatus: "Pending",
        });
        if (existingRequest) {
            return res.status(400).json({ message: "You have already requested this book." });
        }
        const newRequest = new RequestModel({
            Accession: access,
            MemberId: userId,
            Fullname: name,
            IDNumber: idNumber,
            Title: title,
            EditionNumber: edition,
            CallNumber: callNumber,
            RequestStatus: requestStatus,
            AssestBy: assest,
            MemberType: memberType,
            Sent: sent,
        });
        const currentDate = new Date(); 
        const formattedDate = currentDate.toISOString();
        newRequest.DateRequested = formattedDate;
        await newRequest.save();
        res.status(200).json({ message: "Request saved successfully" });
        console.log("request saved successfully");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while processing the request");
    }
});
// REQUEST E --------------------------------------->>>>>>>>>

// CHECKOUT PAGE S
app.post("/check", async (req, res) => {
    try {
        const userId = req.body.userId;
        const idNumber = req.body.idNumber;
        const address = req.body.address;
        const contact = req.body.contact
        const title = req.body.title;
        const callNumber = req.body.callNumber;
        const email = req.body.email;
        const dateRequested = req.body.dateRequested;
        const requestStatus = req.body.requestStatus;
        const name = req.body.name;
        const edition = req.body.edition;
        const image = req.body.image;
        const bookId = req.body.bookId;
        const author = req.body.author;
        const access = req.body.access;
        const member = req.body.type;
        res.render("check", { user: req.session.user, access,userId, author, bookId, idNumber, title,
            callNumber, dateRequested, requestStatus, address, contact, email, image, name, edition, member,}); 
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while retrieving the book");
    }
});
// CHECKOUT PAGE E

// STATUS PAGE S
app.get("/status", async (req, res) => {
    try {
        const borrowid = req.query.borrowid;
        // Fetch data from the RequestModel collection
        const request = await RequestModel.findById(borrowid);
        // Fetch data from the Circulation collection
        const circulation = await Circulation.findOne({ _id: borrowid });
        if (!request && !circulation) {
            return res.status(404).send("Book not found");
        }
        const user = await User.findOne({ IDNumber: request ? request.IDNumber : circulation.BorrowerID });
        const book = await Book.findOne({ CallNumber: request ? request.CallNumber : circulation.CallNumber });
        res.render("status", {
            title: request ? request.Title : circulation.Title,
            edition: request ? request.EditionNumber : '', // Adjust as needed
            author: request ? request.CreatorAuthor : circulation.BorrowerName,
            user: user,
            book: book,
            requeststatus: request ? request.RequestStatus : circulation.CirculationStatus,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while retrieving the book");
    }
});
// STATUS PAGE S

// CANCEL REQUEST S --------------------------------------->>>>>>>>>
app.post("/cancel-request/:bookId", async (req, res) => {
    try {
        const bookId = req.params.bookId;
        const userId = req.session.user._id;
        const request = await RequestModel.findOne({
            MemberId: userId,
            RequestStatus: "Pending"
        });
        if (!request) {
            return res.status(404).send("Request not found");
        }
        request.RequestStatus = "Cancelled";
        const currentDate = new Date(); 
        const formattedDate = currentDate.toISOString();
        request.DateAssest = formattedDate;
        await request.save();
        console.log("Request cancelled successfully");
        res.status(200).json({ message: "Request cancelled successfully" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while cancelling the request");
    }
});
// CANCEL REQUEST E --------------------------------------->>>>>>>>>

// BOOK BOOKMARK S --------------------------------------->>>>>>>>>
app.post("/bookmark", async (req, res) => {
    try {
        const userId = req.body.userId;
        const bookId = req.body.bookId;
        const callNumber = req.body.callNumber;
        // Check if the book is already bookmarked by the user
        const existingBookmark = await BookMark.findOne({
            MemberId: userId,
            CallNumber: callNumber,
        });
        if (existingBookmark) {
            // Book is already bookmarked
            return res.status(400).json({ message: "Book already bookmarked" });
        }
        const name = req.body.name;
        const idNumber = req.body.idNumber;
        const bookmark = new BookMark({
            MemberId: userId,
            BookId: bookId,
            Fullname: name,
            IDNumber: idNumber,
            CallNumber: callNumber,
        });
        await bookmark.save();
        res.status(200).json({ message: "Bookmarked Successfully" });
        console.log("Bookmarked Successfully");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while processing the request");
    }
});
// BOOK BOOKMARK S --------------------------------------->>>>>>>>>

// BOOKMARK PAGE S
app.get("/bookmarks", async (req, res) => {
    try {
        const userId = req.session.user._id;
        // Determine the current page from the query parameters
        const page = parseInt(req.query.page) || 1;
        const perPage = 3; // Set the number of bookmarks per page
        const boomark = await BookMark.find({
            MemberId: userId,
        })
        .skip((page - 1) * perPage)
        .limit(perPage);
            // Calculate pagination information
            const totalBookmarks = await BookMark.countDocuments({ MemberId: userId });
            const totalPages = Math.ceil(totalBookmarks / perPage);
            const hasPrev = page > 1;
            const hasNext = page < totalPages;
            const prevPage = hasPrev ? page - 1 : null;
            const nextPage = hasNext ? page + 1 : null;
        for (const book of boomark) {
            const item = await Book.findOne({ CallNumber: book.CallNumber });
            book.Image = item.ItemImage;
            book.Author = item.CreatorAuthor;
            book.Title = item.Title;
        }
        console.log("Bookmark Books:", boomark);
        res.render("bookmarks", { boomark, hasPrev, hasNext, prevPage, nextPage });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while fetching reserved books");
    }
});
// BOOKMARK PAGE E

// REMOVE BOOKMARK S --------------------------------------->>>>>>>>>
app.post("/deleteBookmark/:bookmarkId", async (req, res) => {
    try {
        const bookmarkId = req.params.bookmarkId;
        // Use Mongoose to find and delete the bookmark
        await BookMark.findByIdAndDelete(bookmarkId);
        res.status(200).json({ message: "Bookmark deleted successfully" });
        console.log("Bookmark deleted successfully");
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while deleting the bookmark");
    }
});
// REMOVE BOOKMARK E --------------------------------------->>>>>>>>>

// SEARCH RESULT PAGE S 
app.get("/search", async (req, res) => {
    try {
        const searchQuery = req.query.query;
        // Query your database to find books based on the searchQuery
        const searchResults = await Book.find({ Title: { $regex: searchQuery, $options: 'i' } });
        const randomBooks = await Book.aggregate([
            {$sample: { size: 4 }}
        ]);
        // Render the search results in the search.hbs template
        res.render("search", { searchResults, randomBooks });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while processing the search");
    }
});
// SEARCH RESULT PAGE E


app.listen(3000,()=>{
    console.log("port connected")
})