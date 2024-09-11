
require("dotenv").config();
const path=require("path");
const express=require("express");
const fs = require('fs');
const Userroute=require('./routes/user');
const blogroute=require('./routes/blog');
const cookieParser=require("cookie-parser")
const {checkforAuthenticationcookie}=require('./middlewares/authentication')
const Blog=require('./models/blog');

const mongoose=require("mongoose");

const app=express();
const port=process.env.PORT||8000;

mongoose
.connect(process.env.MONGO_URL)
.then((e)=>console.log("mongodb connected"));
app.set("view engine","ejs");

app.set("views",path.resolve("./views"));

app.use(express.urlencoded({extended:false}));

app.use(cookieParser());
app.use(checkforAuthenticationcookie("token"));
app.use(express.static(path.resolve("./public")))

app.get('/',async (req,res)=>{
    const allBlogs=await Blog.find({});
    res.render("home",{
        user:req.user,
        blogs:allBlogs,
    });
})

app.use('/user',Userroute);
app.use('/blog',blogroute);

app.listen(port,()=>{
    console.log("server started at port",port);
})