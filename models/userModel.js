const mongoose =require('mongoose')
const Schema = mongoose.Schema

const userSchema = new Schema({
    name:{
        type:String,
    },
    email:{
        type:String,
        lowercase:true,
        unique:true,
        required:true,
    },
    username:{
        type:String,
        unique:true,
        required:true,
    },
    password:{
        type:String,
        required:true,
    },
})

module.exports = mongoose.model('user',userSchema);
