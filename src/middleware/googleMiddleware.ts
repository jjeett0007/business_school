export const isLoggedIn = (req: any, res: any, next: any) => {
  if (req.user) {
    next();
  } else {
    res.sendStatus(401);
  }
};
