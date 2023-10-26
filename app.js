require("dotenv").config()

const express = require("express")
const app = express()
const {PORT} = process.env
const router = require("./routes/account.routes")

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use("/api/v1",router)


app.use((err,req,res,next) => {
    if (err.cause === 400) {
        return res.status(400).json({
            status : "error",
            message : "bad request",
            data : err.message
        })
    }

    if (err.cause === 401) {
        return res.status(401).json({
            status : "error",
            message : "Unathorized",
            data : err.message
        })
    }
    
    return res
            .status(500)
            .json({
                status : false,
                message : err.message,
                data : null
            })
})

app.listen(PORT, () => console.log("listening to port",PORT))