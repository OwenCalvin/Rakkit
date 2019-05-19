import * as BodyParser from "koa-bodyparser";
import { createConnection } from "typeorm";
import * as Cors from "@koa/cors";
import { Rakkit } from "../..";

export class Main {
  static async start() {
    createConnection({
      type: "mysql",
      host: "localhost",
      port: 3306,
      username: "root",
      password: "root",
      database: "tsd",
      synchronize: true,
      entities: [
        `${__dirname}/Models/*.ts`
      ]
    });

    Rakkit.start({
      rest: {
        globalAppMiddlewares: [
          Cors(),
          BodyParser()
        ],
        routers: [`${__dirname}/Routers/*Router.ts`]
      }
    });
  }
}

Main.start();
