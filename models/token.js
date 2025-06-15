const mongoose=require('mongoose');

const tokenschema= new mongoose.Schema({
    loginid :
    {
        type : mongoose.Schema.Types.ObjectId,
        ref :'login',
    },
    token:
    {
        type: String,
    },

   

})

const token = mongoose.model('token',tokenschema);
module.exports={token}