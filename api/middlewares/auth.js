// const { ValidateSignature } = require("../../utils");

// module.exports = async (req, res, next) => {
//   console.log("in the auth middleware");

//   const isAuthorized = await ValidateSignature(req);

//   // if(isAuthorized){
//   //     return next();
//   // }
//   // return res.status(403).json({message: 'Not Authorized'})
//   if (isAuthorized) {
//     // Check role-based access control (RBAC)
//     if (req.user && req.user.role) {
//       // Implement role validation here
//       const allowedRoles = req.allowedRoles || [];
//       if (allowedRoles.length && !allowedRoles.includes(req.user.role)) {
//         return res
//           .status(403)
//           .json({ message: "Forbidden: Insufficient role" });
//       }
//     }
//     return next();
//   }

//   return res.status(403).json({ message: "Not Authorized" });
// };


const { ValidateSignature } = require("../../utils");

module.exports = async (req, res, next) => {
  const isAuthorized = await ValidateSignature(req);

  if (isAuthorized) {
    return next();
  }
  return res.status(403).json({ message: "Not Authorized" });
};