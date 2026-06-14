    import jwt from 'jsonwebtoken'

    const authUser = async (req, res, next) => {
        const {token} = req.headers;
        if (!token) {
            return res.json({success: false, message: 'Not Authorized Login Again'})
        }
        try {
            const token_decode = jwt.verify(token, process.env.JWT_SECRET)
            console.log("HEADERS RECEIVED:", req.headers);
            req.userId = token_decode.id   // ✅ fixed: was req.body.userId
            next()
        } catch (error) {
            console.log(error)
            console.log("HEADERS RECEIVED:", req.headers);
            res.json({success: false, message: error.message})
        }
    }

    export default authUser