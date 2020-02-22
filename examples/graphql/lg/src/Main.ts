import "reflect-metadata";
import { createConnection } from "typeorm";
import { ApolloServer } from 'apollo-server-koa';
import { Rakkit } from '../../../../src';

export class Main {
  static async start() {
    const connection = await createConnection({
      type: "mysql",
      host: "localhost",
      port: 3306,
      username: "root",
      password: "12345678",
      database: "lg",
      synchronize: true,
      entities: [`${__dirname}/models/*Model.ts`]
    });

    await Rakkit.start({
      gql: {
        resolvers: [`${__dirname}/resolvers/*Resolver.ts`],
        emitSchemaFile: `${__dirname}/schema.gql`,
      }
    });

    const server = new ApolloServer({
      schema: Rakkit.MetadataStorage.Gql.Schema,
      playground: true,
    });

    server.applyMiddleware({
      app: Rakkit.Instance.KoaApp
    });
  }
}

Main.start();
