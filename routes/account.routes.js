const {register,login,updateProfile,authenticate} = require("../controllers/users.controller")
const {image} = require("../libs/multer")
const router = require("express").Router()

router.post("/register",register)
router.post("/login",login)
router.post("/updateProfile/:id",image.single('file'),updateProfile)

router.get("/authenticate",authenticate)

module.exports = router