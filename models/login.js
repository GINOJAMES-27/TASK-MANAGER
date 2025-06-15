const mongoose=require('mongoose');

const loginschema= new mongoose.Schema({
    email:{
        type:String,
    },
    password :
    {
        type : String,
    },
    role :
    {
        type :String,
        enum :['admin','enduser'],
    },
   
    name :
    {
        type : String,
    },
    phone :
    {
        type : Number,
    },
    status :
    {
        type:Boolean,
        default: true,
    },
})

const login = mongoose.model('login',loginschema);
module.exports={login}