const isAuth = (req, res, next)=>{
    if(req.session.isAuth){
        next()
    }else{
        // return res.status(401).json("Session expired, Please Login Again")
        return res.render("expire")
    }
}

module.exports ={ isAuth};