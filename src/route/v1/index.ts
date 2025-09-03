import express from "express";

const router = express.Router();
import chat from "./chat.route";

interface RouteConfig {
  path: string;
  route: express.Router;
}

const defaultRoutes: RouteConfig[] = [
  {
    path: "/chat",
    route: chat
  }
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
