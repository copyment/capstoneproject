const express = require('express')
const mongoose=require("mongoose")
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
var session = require("express-session");
const app = express()
var path = require("path")
const {User, MessageModel, Book, RequestModel} = require ("./mongodb");
const multer = require("multer");
const sharp = require('sharp');
const {format, parseISO} = require("date-fns");
const crypto = require('crypto');

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


const tempelatePath=path.join(__dirname,'../Pages')
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
    res.send("API WORKING SUCCESS");
})
app.get("/signup", (req,res)=>{
    res.render("signup")
})
app.get("/login", (req,res)=>{
    res.render("login")
})




app.get("/home", async (req,res) => {
    try {
        const latestBooks = await Book.find()
        .sort({ DateCatalog: -1 })
        .limit(4);
        const randomBooks = await Book.aggregate([
            {$sample: { size: 4 }}
        ]);
        const topBooks = await Book.aggregate([
            {$sample: { size: 1 }}
        ]);
        res.render("home", {latestBooks, randomBooks, topBooks});
    } catch (error){
        console.error("Error:", error);
        res.status(500).send("Error occured.")
    }
});
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

app.get("/FRONT", (req,res)=>{
    res.render("FRONT")
})
app.get("/toppages", async (req, res) => {
    try {
        const books = await Book.find(); 
        console.log("Retrieved books:", books);
        const groupedBooks = groupBooksIntoRows(books, 4);
        res.render("toppages", { groupedBooks }); 
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

app.get("/logout", (req,res)=>{
    req.session.destroy();
    res.render("FRONT");
})

app.get("/item", async (req, res) => {
    try {
        const bookId = req.query.bookId;
        const book = await Book.findById(bookId); 


        if (!book) {
            return res.status(404).send("Book not found");
        }

        const itemsCopiesCollection = mongoose.connection.collection("ItemsCopies");

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

app.get("/bcollection", async (req, res) => {
    try {
        const books = await Book.find(); 
        console.log("Retrieved books:", books);
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

app.get("/myreserved", async (req, res) => {
    try {
        const userId = req.session.user._id;
        const reservedBooks = await RequestModel.find({
            MemberId: userId,
            $or: [{ RequestStatus: "Pending" }, { RequestStatus: "pending" }]
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

app.post("/signup", upload.single("profilePicture"),async (req,res)=>{
try {
    const idNumber = req.body.idnumber;
    const contact = req.body.contact;
    const email = req.body.email;
    const rfid = req.body.rfid;
    const usern = req.body.username;

    const existingID = await User.findOne({ IDNumber: idNumber });
    const existingContact = await User.findOne({ ContactNumber: contact });
    const existingEmail = await User.findOne({ Email: email });
    const existingRfid = await User.findOne({ Rfid: rfid });
    const existingUsern = await User.findOne({ Username: usern });

    if (existingID) {
        return res.render("signup", {errorMessage: "ID number already exist, Please try another!"});
    }
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

// GET DATA FROM REGISTRATION E

// LOG IN S
app.post("/login",async (req,res)=>{
    try {
        const check = await User.find({Username:req.body.username});
    if(check.length > 0 && check[0].Password === req.body.password) {
        const user = check[0];
        req.session.user = user;
        res.redirect("/home");
    }
    else{
        res.render("login", { errorMessage: "Incorrect Username or Password, Try Again!" });
    }
    }
    catch (error){
        console.error("error during login:", error)
        res.render("login", { errorMessage: "An error occurred. Please try again later." });
    }
    })
// LOG IN E


app.post("/request", async (req, res) => {
    try {
        const userId = req.body.userId;
        const name = req.body.fullname;
        const idNumber = req.body.idNumber;
        const bookId = req.body.bookId;
        const title = req.body.title;
        const callNumber = req.body.callNumber;
        const dateRequested = req.body.dateRequested;
        const requestStatus = req.body.requestStatus;
        const edition = req.body.edition;
        const access = req.body.access;
    
        const newRequest = new RequestModel({
            Accession: access,
            MemberId: userId,
            BookId: bookId,
            Fullname: name,
            IDNumber: idNumber,
            Title: title,
            EditionNumber: edition,
            CallNumber: callNumber,
            RequestStatus: requestStatus,
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

        res.render("check", { user: req.session.user,
            access,
            userId,
            author,
            bookId,
            idNumber,
            title,
            callNumber,
            dateRequested,
            requestStatus,
            address,
            contact,
            email,
            image,
            name,
            edition,}); 
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while retrieving the book");
    }
});

app.get("/status", async (req, res) => {
    try {
        const borrowid = req.query.borrowid;
        const borrow = await RequestModel.findById(borrowid);
        if (!borrow) {
            return res.status(404).send("Book not found");
        }
        const user = await User.findOne ({ IDNumber: borrow.IDNumber });
        const book = await Book.findOne({CallNumber: borrow.CallNumber});
        res.render("status", {
            borrowid: borrow.OrderID,
            title: borrow.Title,
            edition: borrow.Edition,
            author: borrow.CreatorAuthor,
            user: user,
            book: book,
        });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while retrieving the book");
    }
});

app.post("/cancel-request/:bookId", async (req, res) => {
    try {
        const bookId = req.params.bookId;
        const userId = req.session.user._id;
        const request = await RequestModel.findOne({
            MemberId: userId,
            BookId: bookId,
            RequestStatus: "Pending"
        });
        if (!request) {
            return res.status(404).send("Request not found");
        }
        request.RequestStatus = "Cancelled";
        await request.save();
        console.log("Request cancelled successfully");
        res.status(200).json({ message: "Request cancelled successfully" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("Error occurred while cancelling the request");
    }
});



app.listen(3000,()=>{
    console.log("port connected")
})