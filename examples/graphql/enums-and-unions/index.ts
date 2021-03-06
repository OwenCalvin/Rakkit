import "reflect-metadata";
import { ApolloServer } from "apollo-server";
import { Rakkit } from "../../../src";

import { ExampleResolver } from "./resolver";

async function bootstrap() {
  // build Rakkit executable schema
  await Rakkit.start({
    gql: {
      resolvers: [ExampleResolver]
    }
  });
  const schema = Rakkit.MetadataStorage.Gql.Schema;

  // Create GraphQL server
  const server = new ApolloServer({ schema });

  // Start the server
  const { url } = await server.listen(4000);
  console.log(`Server is running, GraphQL Playground available at ${url}`);
}

bootstrap();
