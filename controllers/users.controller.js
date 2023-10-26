const {PrismaClient} = require("@prisma/client")
const prisma = new PrismaClient()
const jwt = require("jsonwebtoken")
const bcrypt = require("bcrypt")
const{ACCES_TOKEN_SECRET} = process.env
const imagekit = require("../libs/imagekit")
const path = require("path")
const { create } = require("domain")

module.exports = {
    register : async (req,res,next) => {
        try {
        
            const email = req.body.email
            const password = req.body.password
            if (!email || !password) throw new Error("password and email are required fields",{cause : 400}) 

            const encryptedPassword = await bcrypt.hash(password, 10);
        
        
            const checkEmail = await prisma.user.findMany({ 
                where: {
                    email : email
                }
            })
            if (checkEmail.length > 0) throw new Error("email used by other user!",{cause : 400}) 
            const newUser = await prisma.user.create({
                data : {
                    email : email,
                    password : encryptedPassword,
                    userProfile : {
                        create : {
                            first_name : '',
                            last_name : '',
                            birth_date :new Date,
                            profile_picture:"https://ik.imagekit.io/rianrafli/blank-profile-picture-973460_1280.webp?updatedAt=1698310046352"
                        }
                    }
                } 
            })

            
            delete newUser.password
          
            const result = {
                status : 'success',
                message : 'new user created succesfully! ',
                data : {
                    newUser
                }
            }
        
            res
            .status(201)
            .json(result)

        } catch (err) {
            next(err)
        }

},



    login : async (req,res,next) => {
        try {
            const email = req.body.email
            const password = req.body.password

            if ((!email) || (!password)) throw new Error("email and password are required fields",{cause : 400}) 
            const foundUser = await prisma.user.findUnique({
                where : {
                    email : email
                }
            })
            console.log( foundUser);

            if (!foundUser) throw new Error("email or password is not valid")

            const encryptedPassword = foundUser.password

            const checkPassword = await bcrypt.compare(password,encryptedPassword)

            if (!checkPassword) throw new Error("email or password is not valid",{cause : 400})

            const accesToken = jwt.sign({
                id : foundUser.id,
                name : foundUser.name
            },ACCES_TOKEN_SECRET)

            const result = {
                status : 'success',
                message : 'login succes! ',
                data : {
                    user : foundUser,
                    accesToken : accesToken
                }
            }

            res
            .status(200)
            .json(result)

        } catch (err) {
            next(err)
        }
    },


    updateProfile : async (req,res,next) => {
        try {
            const image = req.file.buffer.toString('base64')
            const id = Number(req.params.id)
            const first_name = req.body.first_name
            const last_name = req.body.last_name
            const birth_date = new Date(req.body.birth_date) // contoh format :"2021-01-01"

            const {url} = await imagekit.upload({
                file : image, //required
                fileName : Date.now()+ path.extname(req.file.originalname),   //required
            })


            
            if (isNaN(id)) throw new Error("Id should be number",{cause : 400})

            const idCheck  = await prisma.user.findUnique({
                where: {
                    id : id
                }
            })
            if ( !first_name || !last_name || !birth_date || !image ) throw new Error("all are required fields",{cause : 400}) 

            if (!idCheck) throw new Error("Id not found",{cause : 400})

            const updatedProfile = await prisma.userProfile.update({
                where : {
                    userid : id
                },
                data : {
                    first_name : first_name,
                    last_name : last_name,
                    birth_date : birth_date,
                    profile_picture : url,
                }
            })
            const result = {
                status : 'success',
                message : 'profile updated succesfully! ',
                data : updatedProfile
            }
            res
            .status(201)
            .send(result)

        } catch (err) {
            next(err)
        }
    },


    authenticate  : async (req,res,next) => {
        try {
            let  authorization  = req.headers['authorization'];            
            if (!authorization) throw new Error("invalid token", {cause : 401})
            authorization = authorization.split(' ')[1];
            const decoded = await jwt.verify(authorization,process.env.ACCES_TOKEN_SECRET)
            const user = await prisma.user.findUnique({
                where : {
                    id : decoded.id
                }, 
                include : {
                    userProfile : true
                }
            })


            const userResponse = {
                first_name: user.userProfile.first_name,
                last_name: user.userProfile.last_name,
                email: user.email,
                birth_date: user.userProfile.birth_date,
                profile_picture: user.userProfile.profile_picture
            }


            const result = {
                status : 'success',
                message : 'authenticated!',
                data : userResponse
                
            }

            res
            .status(200)
            .json(result)
        } catch (err) {
            console.log(err.name);
            if (err.name === "JsonWebTokenError") err.cause = 401
                
            next(err)
        }
    }

}