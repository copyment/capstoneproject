const mongoose=require("mongoose")
mongoose.set("strictQuery", false);

mongoose.connect("mongodb+srv://virusdetected848:helloworld123@cluster0.mootble.mongodb.net/LMS?retryWrites=true&w=majority")
.then(()=>{
    console.log("mongodb connected");
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
        required:true
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
        type: String,
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
    Currency:{
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

});

const RequestSchema = new mongoose.Schema({
    MemberId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    BookId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
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
});

const RequestModel = mongoose.model("RequestCollection", RequestSchema, "requests");
const User = mongoose.model("UserCollection", UserSchema, "members");
const MessageModel = mongoose.model("InquiriesCollection", MessageSchema, "inquiries");
const Book = mongoose.model("IItemCollection", BookSchema, "items");

module.exports = {User, MessageModel, Book, RequestModel};