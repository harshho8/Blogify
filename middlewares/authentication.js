const { validateToken } = require("../services/authentication");

function checkforAuthenticationcookie(cookiename){
    return (req,res,next)=>{
        const token=req.cookies[cookiename];
          
        if(!token){
           return next();
        }
        else{
            try{
                const payload=validateToken(token);
                req.user=payload;
            }
            catch(err){

            }
        }
       return next();
    }
}

module.exports={
    checkforAuthenticationcookie,
}