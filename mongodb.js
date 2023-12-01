const mongoose=require("mongoose")
mongoose.set("strictQuery", false);

mongoose.connect("mongodb://0.0.0.0:27017/LMS")
//mongoose.connect("mongodb+srv://virusdetected848:helloworld123@cluster0.mootble.mongodb.net/LMS?retryWrites=true&w=majority")
.then(()=>{
    console.log("mongodb connecteds");
})
.catch(()=>{
    console.log("failed to connect");
})

const UserSchema=new mongoose.Schema({
    Fullname:{
        type:String,
        required:true
    },
    Address:{
        type:String,
        required:true
    },
    Age:{
        type:String,
        required:true
    },
    Birthday:{
        type:String,
    },
    Email:{
        type:String,
        required:true
    },
    ContactNumber:{
        type:String,
        required:true
    },
    IDNumber:{
        type:String,
    },
    Username:{
        type:String,
        required:true
    },
    Rfid:{
        type:String,
    },
    Password:{
        type:String,
        required:true
    },
    AccountType:{
        type:String,
        required:true
    },
    DateRegistered: {
        type: Date
    },
    ProfilePicture: {
        type: String,
    },
    Status:{
        type: Number,
    },
});

const MessageSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const BookSchema = new mongoose.Schema({
    CallNumber: {
        type: String,
    },
    Title: {
        type: String,
    },
    ItemType: {
        type: String,
    },
    AccessLevel:{
        type: String,
    },
    Country:{
        type: String,
    },
    CreationDate:{
        type: String,
    },
    Publisher:{
        type: String,
    },
    Language: {
        type: String,
    },
    CreatorAuthor: {
        type: String,
    },
    Subject:{
        type: String,
    },
    Category:{
        type: String,
    },
    Genre: {
        type: String,
    },
    SeriesNumber:{
        type: String,
    },
    SeriesTitle: {
        type: String,
    },
    Description: {
        type: String,
    },
    IdentifiersType:{
        type: String,
    },
    IdentifiersCode:{
        type: String,
    },
    AgeRestriction:{
        type: String,
    },
    Format:{
        type: String,
    },
    Price:{
        type: String,
    },
    ItemRFID:{
        type: String,
    },
    EditionNumber:{
        type: String,
    },
    EditionTitle:{
        type: String,
    },
    EditionYear:{
        type: String,
    },
    Pages:{
        type: String,
    },
    CatalogStatus:{
        type: String,
    },
    Addedby:{
        type: String,
    },
    DateCatalog:{
        type: String,
    },
    ItemImage: {
        type: String,
    },
    MissingFine: {
        type: String,
    },
    DamageFine: {
        type: String,
    },
    LatestCopy:{
        type: String,
    },


});

const RequestSchema = new mongoose.Schema({
    MemberId: {
        type: String,
        ref: 'User',
    },
    Accession: {type: String,},
    Fullname:{ type:String,},
    IDNumber:{ type:String,},
    Title: { type:String,},
    EditionNumber: {type: String,},
    CallNumber: {type: String,},
    DateRequested: {type:Date,},
    DateAssest: {type: Date, default: new Date('1970-01-01T00:00:00.000Z')},
    PickupDate: {type: Date, default: new Date('1970-01-01T00:00:00.000Z')},
    PickupDue: {type: Date, default: new Date('1970-01-01T00:00:00.000Z')},
    RequestStatus: {type:String,},
    AssestBy: {type:String,},
    MemberType: {type:String,},
});


const BookMarks = new mongoose.Schema({
    MemberId: {
        type: String,
        ref: 'User',
    },
    BookId: {
        type: String,
        ref: 'Book',
    },
    Fullname:{ type:String,},
    IDNumber:{ type:String,},
    CallNumber: {type: String,},
});

const CirculationSchema = new mongoose.Schema({
    Accession: { type:String,},
    CallNumber: { type:String,},
    Title: { type:String,},
    BorrowerName: { type:String,},
    BorrowerType: { type:String,},
    BorrowerMemberID: { type:String,},
    BorrowerMemberRFID: { type:String,},
    BorrowerID: { type:String,},
    IssueDate: { type:Date,},
    DueDate: { type:Date,},
    ReturnDate: { type:Date,},
    LoanType: {type:String,},
    PenaltyAmount: { type:String,},
    PenaltyStatus: { type:String,},
    CirculationStatus: { type:String,},
    IssueBy: { type:String,},
    HandleBy: {type:String,},
});

const Circulation = mongoose.model("CirculationCollection", CirculationSchema, "circulations");
const RequestModel = mongoose.model("RequestCollection", RequestSchema, "requests");
const User = mongoose.model("UserCollection", UserSchema, "members");
const MessageModel = mongoose.model("InquiriesCollection", MessageSchema, "inquiries");
const Book = mongoose.model("IItemCollection", BookSchema, "items");
const BookMark = mongoose.model("BookMarkCollection", BookMarks, "bookmarks");

module.exports = {User, MessageModel, Book, RequestModel, BookMark, Circulation};