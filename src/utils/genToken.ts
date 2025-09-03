// import jwt from "jsonwebtoken";
// import { config } from "../config";
// import { Token } from "../model/index";

// const jwtSecret = config.jwt.secret;

// const generateToken = async (data: {
//   id: any;
//   email: any;
//   role: any;
//   type: any;
// }) => {
//   const { type = "access", email, id, role = "user" } = data;
//   const userId = id.toString();

//   let expiresIn: number;

//   switch (type) {
//     case "access":
//       expiresIn = config.jwt.accessExpirationMinutes * 60;
//       break;
//     case "refresh":
//       expiresIn = config.jwt.refreshExpirationMinutes * 60;
//       break;
//     case "reset":
//       expiresIn = 300;
//       break;
//     case "2fa":
//       expiresIn = 600;
//       break;
//     default:
//       throw new Error("Invalid token type");
//   }

//   const token = jwt.sign({ email, id: userId, role }, jwtSecret, { expiresIn });

//   await Token.create({
//     userId,
//     token,
//     type,
//     role,
//     status: type === "reset" || type === "2fa" ? "revoked" : "active",
//     expiresAt: new Date(Date.now() + expiresIn * 1000),
//   });

//   return { access: token, expiresIn };
// };

// export default generateToken;
