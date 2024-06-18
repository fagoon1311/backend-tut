// since the connection to DB code could be required at multiple places so rather than writing it again and again we can
// implement it here using a wrapper function that executes it and exports the result.
// this will be a higher order function ( a fn that takes a fn as an arg/ return a function.).


 // =======TRY CATCH METHOD=================//
// const asyncHandler = (fn) => async (req, res, next) =>{
//     try {
        
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }

// Errors will also be sent multiple times. So we can also generalise this.

// }


// ==========PROMISES METHOD ============//
 const asyncHandler = (requestHandler) => {
    return (req, res, next)=>{
        Promise.resolve(requestHandler(req, res, next)).catch((err)=>next(err))
    }
 }


export { asyncHandler }