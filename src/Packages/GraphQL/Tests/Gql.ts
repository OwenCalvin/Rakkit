// #region Imports
import { ApolloServer } from "apollo-server-koa";
import Axios from "axios";
import {
  graphql,
  IntrospectionQuery,
  getIntrospectionQuery,
  TypeKind,
  IntrospectionInterfaceType,
  IntrospectionObjectType,
  IntrospectionInputObjectType,
  IntrospectionEnumType,
  GraphQLObjectType,
  IntrospectionUnionType,
  IntrospectionNamedTypeRef,
  GraphQLID,
  IntrospectionListTypeRef,
  GraphQLInterfaceType
} from "graphql";
import {
  Rakkit,
  ObjectType,
  Field,
  MetadataStorage,
  Resolver,
  Query,
  InterfaceType,
  InputType,
  EnumType,
  EnumField,
  TypeCreator,
  IContext,
  Arg
} from "../../..";
// #endregion

@Resolver()
class BaseResolver {
  @Query()
  hello(): String {
    return "hello";
  }
}

@EnumType("SimpleEnumClass", {
  description: "a simple enum from class"
})
class SimpleEnumClassType {
  @EnumField("hello", {
    description: "enum field description",
    deprecationReason: "deprecated"
  })
  enumField: string;
}

@InterfaceType("SimpleInterface", {
  description: "a simple interface"
})
class SimpleInterfaceType {
  @Field({
    deprecationReason: "deprecated",
    description: "an interface field"
  })
  interfaceField: number;
}

@ObjectType("SimpleType", {
  description: "a simple type",
  implements: SimpleInterfaceType
})
class SimpleObjectType implements SimpleInterfaceType {
  @Field({
    deprecationReason: "deprecated",
    description: "an object field"
  })
  field: string;
  interfaceField: number;
}

@InputType("SimpleInput", {
  description: "a simple input"
})
class SimpleInputType {
  @Field({
    defaultValue: "123",
    description: "an input field"
  })
  inputField: string;
}

enum enumType {
  a = "a"
}

const enumFromTypeCreator = TypeCreator.CreateEnum(enumType, {
  name: "SimpleEnumTypeCreator",
  description: "a simple enum from TypeCreator"
});

@ObjectType()
class ObjectTypeForUnion {
  @Field()
  unionField: String;
}

const unionType = TypeCreator.CreateUnion(
  [SimpleObjectType, ObjectTypeForUnion],
  { name: "UnionType", description: "an union type" }
);

@InputType()
@InterfaceType()
@ObjectType()
class ThreeTypes {
  @Field()
  threeField: String;
}

describe("GraphQL", () => {
  afterEach(async () => {
    await Rakkit.stop();
  });

  describe("Simple type definition", () => {
    it("Should create an interface type", async () => {
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "SimpleInterface") as IntrospectionInterfaceType;

      expect(simpleType.kind).toBe(TypeKind.INTERFACE);
      expect(simpleType.description).toBe("a simple interface");
      expect(simpleType.fields[0].name).toBe("interfaceField");
      expect(simpleType.fields[0].deprecationReason).toBe("deprecated");
      expect(simpleType.fields[0].description).toBe("an interface field");
    });

    it("Should create an object type", async () => {
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "SimpleType") as IntrospectionObjectType;

      expect(simpleType.kind).toBe(TypeKind.OBJECT);
      expect(simpleType.description).toBe("a simple type");
      expect(simpleType.fields.map((field) => field.name)).toEqual(["field", "interfaceField"]);
      expect(simpleType.interfaces[0].name).toBe("SimpleInterface");
      expect(simpleType.fields[0].deprecationReason).toBe("deprecated");
      expect(simpleType.fields[0].description).toBe("an object field");
      expect(simpleType.fields[1].deprecationReason).toBe("deprecated");
      expect(simpleType.fields[1].description).toBe("an interface field");
    });

    it("Should create an input type", async () => {
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "SimpleInput") as IntrospectionInputObjectType;

      expect(simpleType.kind).toBe(TypeKind.INPUT_OBJECT);
      expect(simpleType.description).toBe("a simple input");
      expect(simpleType.inputFields[0].name).toBe("inputField");
      expect(simpleType.inputFields[0].defaultValue).toBe("\"123\"");
      expect(simpleType.inputFields[0].description).toBe("an input field");
    });

    it("Should create an enum type from class", async () => {
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "SimpleEnumClass") as IntrospectionEnumType;

      expect(simpleType.kind).toBe(TypeKind.ENUM);
      expect(simpleType.description).toBe("a simple enum from class");
      expect(simpleType.enumValues[0].name).toBe("enumField");
      expect(simpleType.enumValues[0].deprecationReason).toBe("deprecated");
      expect(simpleType.enumValues[0].description).toBe("enum field description");
    });

    it("Should create an enum type from TypeCreator", async () => {
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "SimpleEnumTypeCreator") as IntrospectionEnumType;

      expect(simpleType.kind).toBe(TypeKind.ENUM);
      expect(simpleType.description).toBe("a simple enum from TypeCreator");
      expect(simpleType.enumValues[0].name).toBe("a");
    });

    it("Should create an union type", async () => {
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "UnionType") as IntrospectionUnionType;

      expect(simpleType.kind).toBe(TypeKind.UNION);
      expect(simpleType.description).toBe("an union type");
      expect(simpleType.possibleTypes.map((possibleType) => possibleType.name)).toEqual(["SimpleType", "ObjectTypeForUnion"]);
    });

    it("Should create a PartialType of ObjectType", async () => {
      const partialType = TypeCreator.CreatePartial(SimpleObjectType, {
        name: "MyPartialSimpleObjectType",
        description: "an object partial type"
      });
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "MyPartialSimpleObjectType") as IntrospectionObjectType;

      expect(simpleType.kind).toBe(TypeKind.OBJECT);
      expect(simpleType.description).toBe("an object partial type");
      expect(simpleType.fields[0].type.kind).not.toBe("NON_NULL");
      expect(simpleType.fields[1].type.kind).not.toBe("NON_NULL");
    });

    it("Should create a PartialType of ObjectType", async () => {
      const partialType = TypeCreator.CreatePartial(SimpleInputType, {
        name: "MyPartialSimpleInputType",
        description: "an input partial type"
      });
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "MyPartialSimpleInputType") as IntrospectionInputObjectType;

      expect(simpleType.kind).toBe(TypeKind.INPUT_OBJECT);
      expect(simpleType.description).toBe("an input partial type");
      expect(simpleType.inputFields[0].type.kind).not.toBe("NON_NULL");
    });

    it("Should create a PartialType of InterfaceType", async () => {
      const partialType = TypeCreator.CreatePartial(SimpleInterfaceType, {
        name: "MyPartialSimpleInterfaceType",
        description: "an interface partial type"
      });
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "MyPartialSimpleInterfaceType") as IntrospectionInterfaceType;

      expect(simpleType.kind).toBe(TypeKind.INTERFACE);
      expect(simpleType.description).toBe("an interface partial type");
      expect(simpleType.fields[0].type.kind).not.toBe("NON_NULL");
    });

    it("Should create a RequiredType of InputType", async () => {
      const partialType = TypeCreator.CreatePartial(SimpleInputType, {
        name: "MyPartialSimpleInputTypeForRequired",
        description: "an input partial type"
      });
      const requiredType = TypeCreator.CreateRequired(partialType, {
        name: "MyRequiredSimpleInputType",
        description: "an input required type"
      });
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "MyRequiredSimpleInputType") as IntrospectionInputObjectType;

      expect(simpleType.kind).toBe(TypeKind.INPUT_OBJECT);
      expect(simpleType.description).toBe("an input required type");
      expect(simpleType.inputFields[0].type.kind).toBe("NON_NULL");
    });

    it("Should create a RequiredType of ObjectType", async () => {
      const partialType = TypeCreator.CreatePartial(SimpleObjectType, {
        name: "MyPartialSimpleObjectTypeForRequired",
        description: "an object partial type"
      });
      const requiredType = TypeCreator.CreateRequired(partialType, {
        name: "MyRequiredSimpleObjectType",
        description: "an object required type"
      });
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "MyRequiredSimpleObjectType") as IntrospectionObjectType;

      expect(simpleType.kind).toBe(TypeKind.OBJECT);
      expect(simpleType.description).toBe("an object required type");
      expect(simpleType.fields[0].type.kind).toBe("NON_NULL");
      expect(simpleType.fields[1].type.kind).toBe("NON_NULL");
    });

    it("Should create a RequiredType of InterfaceType", async () => {
      const partialType = TypeCreator.CreatePartial(SimpleInterfaceType, {
        name: "MyPartialSimpleInterfaceTypeForRequired",
        description: "an interface partial type"
      });
      const requiredType = TypeCreator.CreateRequired(partialType, {
        name: "MyRequiredSimpleInterfaceType",
        description: "an interface required type"
      });
      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "MyRequiredSimpleInterfaceType") as IntrospectionInterfaceType;

      expect(simpleType.kind).toBe(TypeKind.INTERFACE);
      expect(simpleType.description).toBe("an interface required type");
      expect(simpleType.fields[0].type.kind).toBe("NON_NULL");
    });

    it("Should create multiple version of a class with different gqlType", async () => {
      @InputType("InputThreeTypes", {
        description: "input"
      })
      @InterfaceType("InterfaceThreeTypes", {
        description: "interface"
      })
      @ObjectType("ObjectThreeTypes", {
        description: "object"
      })
      class ThreeTypesCustom {
        @Field()
        threeField: String;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const ObjectThreeTypes = schema.types.find((schemaType) => schemaType.name === "ObjectThreeTypes") as IntrospectionObjectType;
      const InputThreeTypes = schema.types.find((schemaType) => schemaType.name === "InputThreeTypes") as IntrospectionInputObjectType;
      const InterfaceThreeTypes = schema.types.find((schemaType) => schemaType.name === "InterfaceThreeTypes") as IntrospectionInterfaceType;

      expect(ObjectThreeTypes.kind).toBe(TypeKind.OBJECT);
      expect(ObjectThreeTypes.description).toBe("object");

      expect(InputThreeTypes.kind).toBe(TypeKind.INPUT_OBJECT);
      expect(InputThreeTypes.description).toBe("input");

      expect(InterfaceThreeTypes.kind).toBe(TypeKind.INTERFACE);
      expect(InterfaceThreeTypes.description).toBe("interface");
    });
  });

  describe("Ihneritance", () => {
    it("ObjectType should extends", async () => {
      @ObjectType()
      class ObjectTypeIhneritance extends SimpleObjectType {
        @Field()
        ihnField: string;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "ObjectTypeIhneritance") as IntrospectionObjectType;

      expect(simpleType.kind).toBe(TypeKind.OBJECT);
      expect(simpleType.fields.map((field) => field.name)).toEqual(["ihnField", "interfaceField", "field"]);
    });

    it("InputType should extends", async () => {
      @InputType()
      class InputTypeIhneritance extends SimpleObjectType {
        @Field()
        ihnField: string;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "InputTypeIhneritance") as IntrospectionInputObjectType;

      expect(simpleType.kind).toBe(TypeKind.INPUT_OBJECT);
      expect(simpleType.inputFields.map((field) => field.name)).toEqual(["ihnField", "interfaceField", "field"]);
    });

    it("InterfaceType should extends", async () => {
      @InterfaceType()
      class InterfaceTypeIhneritance extends SimpleObjectType {
        @Field()
        ihnField: string;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "InterfaceTypeIhneritance") as IntrospectionInterfaceType;

      expect(simpleType.kind).toBe(TypeKind.INTERFACE);
      expect(simpleType.fields.map((field) => field.name)).toEqual(["ihnField", "interfaceField", "field"]);
    });

    it("class EnumType should extends from class", async () => {
      @EnumType()
      class EnumTypeIhneritance extends SimpleEnumClassType {
        @EnumField("a")
        a: string;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "EnumTypeIhneritance") as IntrospectionEnumType;

      expect(simpleType.kind).toBe(TypeKind.ENUM);
      expect(simpleType.enumValues.map((field) => field.name)).toEqual(["a", "enumField"]);
    });

    it("class EnumType should extends from TypeCreator", async () => {
      @EnumType({
        extends: enumFromTypeCreator
      })
      class EnumTypeIhneritanceTypeCreator {
        @EnumField("b")
        b: string;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "EnumTypeIhneritanceTypeCreator") as IntrospectionEnumType;

      expect(simpleType.kind).toBe(TypeKind.ENUM);
      expect(simpleType.enumValues.map((field) => field.name)).toEqual(["b", "a"]);
    });

    it("TypeCreator EnumType should extends from TypeCreator", async () => {
      enum enumIhneritance {
        b = "b"
      }

      TypeCreator.CreateEnum(enumIhneritance, {
        name: "enumIhneritance",
        description: "enum ihneritance",
        extends: enumFromTypeCreator
      });

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "enumIhneritance") as IntrospectionEnumType;

      expect(simpleType.kind).toBe(TypeKind.ENUM);
      expect(simpleType.enumValues.map((field) => field.name)).toEqual(["b", "a"]);
    });

    it("TypeCreator EnumType should extends from class", async () => {
      enum enumIhneritance {
        a = "a"
      }

      TypeCreator.CreateEnum(enumIhneritance, {
        name: "enumIhneritanceClass",
        description: "enum ihneritance",
        extends: SimpleEnumClassType
      });

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "enumIhneritanceClass") as IntrospectionEnumType;

      expect(simpleType.kind).toBe(TypeKind.ENUM);
      expect(simpleType.enumValues.map((field) => field.name)).toEqual(["a", "enumField"]);
    });

    it("ObjectType should extends from TypeCreator", async () => {
      const partial = TypeCreator.CreatePartial(SimpleObjectType, {
        gqlType: GraphQLObjectType
      });

      @ObjectType({
        extends: partial
      })
      class ObjectTypeTypeCreatorIhneritance {
        @Field()
        ihnField: String;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "ObjectTypeTypeCreatorIhneritance") as IntrospectionObjectType;

      expect(simpleType.kind).toBe(TypeKind.OBJECT);
      expect(simpleType.fields.map((field) => field.name)).toEqual(["ihnField", "field", "interfaceField"]);
    });

    it("InterfaceType should extends from TypeCreator", async () => {
      const partial = TypeCreator.CreatePartial(SimpleObjectType, {
        gqlType: GraphQLObjectType
      });

      @InterfaceType({
        extends: partial
      })
      class InterfaceTypeTypeCreatorIhneritance {
        @Field()
        ihnField: String;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "InterfaceTypeTypeCreatorIhneritance") as IntrospectionInterfaceType;

      expect(simpleType.kind).toBe(TypeKind.INTERFACE);
      expect(simpleType.fields.map((field) => field.name)).toEqual(["ihnField", "field", "interfaceField"]);
    });

    it("InputType should extends from TypeCreator", async () => {
      const partial = TypeCreator.CreatePartial(SimpleObjectType, {
        gqlType: GraphQLObjectType
      });

      @InputType({
        extends: partial
      })
      class InputTypeTypeCreatorIhneritance {
        @Field()
        ihnField: String;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "InputTypeTypeCreatorIhneritance") as IntrospectionInputObjectType;

      expect(simpleType.kind).toBe(TypeKind.INPUT_OBJECT);
      expect(simpleType.inputFields.map((field) => field.name)).toEqual(["ihnField", "field", "interfaceField"]);
    });
  });

  describe("Field", () => {
    it("Should apply timestamp date mode", async () => {
      @ObjectType()
      class TimestampMode {
        @Field({
          nullable: true
        })
        date: Date;
      }

      await Rakkit.start({
        gql: {
          dateMode: "timestamp"
        }
      });
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "TimestampMode") as IntrospectionObjectType;

      expect(simpleType.kind).toBe(TypeKind.OBJECT);

      expect(simpleType.fields[0].name).toBe("date");
      expect((simpleType.fields[0].type as IntrospectionNamedTypeRef).name).toBe("Timestamp");
    });

    it("Should create nullable fields", async () => {
      @ObjectType()
      class Nullable {
        @Field({
          nullable: true
        })
        a: String;

        @Field()
        b: Number;

        @Field({
          nullable: true
        })
        c: Number;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "Nullable") as IntrospectionObjectType;

      expect(simpleType.kind).toBe(TypeKind.OBJECT);

      expect(simpleType.fields[0].name).toBe("a");
      expect(simpleType.fields[0].type.kind).not.toBe("NON_NULL");

      expect(simpleType.fields[1].name).toBe("b");
      expect(simpleType.fields[1].type.kind).toBe("NON_NULL");

      expect(simpleType.fields[2].name).toBe("c");
      expect(simpleType.fields[2].type.kind).not.toBe("NON_NULL");
    });

    it("Should create nullable fields with nullableByDefault", async () => {
      @ObjectType()
      class NullableWithNullableByDefault {
        @Field({
          nullable: false
        })
        a: String;

        @Field()
        b: Number;

        @Field({
          nullable: false
        })
        c: Number;
      }

      await Rakkit.start({
        gql: {
          nullableByDefault: true
        }
      });
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "NullableWithNullableByDefault") as IntrospectionObjectType;

      expect(simpleType.kind).toBe(TypeKind.OBJECT);

      expect(simpleType.fields[0].name).toBe("a");
      expect(simpleType.fields[0].type.kind).toBe("NON_NULL");

      expect(simpleType.fields[1].name).toBe("b");
      expect(simpleType.fields[1].type.kind).not.toBe("NON_NULL");

      expect(simpleType.fields[2].name).toBe("c");
      expect(simpleType.fields[2].type.kind).toBe("NON_NULL");
    });

    it("Should convert primitive type and scalarMap to GraphQL Type and apply params", async () => {
      class ScalarMap {}

      @ObjectType()
      class PrimitiveType {
        @Field({
          description: "a str type",
          nullable: true
        })
        str: String;

        @Field({
          deprecationReason: "deprecated",
          description: "an int type",
          nullable: true
        })
        int: Number;

        @Field({
          nullable: true,
          name: "boolValue",
          description: "a bool type"
        })
        bool: Boolean;

        @Field({
          nullable: true,
          description: "a date type"
        })
        date: Date;

        @Field(type => String, {
          nullable: true,
          description: "an array of string type"
        })
        arrStr: String[];

        @Field({
          nullable: true,
          description: "a scalar type"
        })
        scalarMap: ScalarMap;
      }

      await Rakkit.start({
        gql: {
          scalarMap: [
            [ScalarMap, GraphQLID]
          ]
        }
      });
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "PrimitiveType") as IntrospectionObjectType;

      expect(simpleType.kind).toBe(TypeKind.OBJECT);

      expect(simpleType.fields[0].name).toBe("str");
      expect((simpleType.fields[0].type as IntrospectionNamedTypeRef).name).toBe("String");
      expect(simpleType.fields[0].description).toBe("a str type");

      expect(simpleType.fields[1].name).toBe("int");
      expect((simpleType.fields[1].type as IntrospectionNamedTypeRef).name).toBe("Float");
      expect(simpleType.fields[1].description).toBe("an int type");
      expect(simpleType.fields[1].deprecationReason).toBe("deprecated");

      expect(simpleType.fields[2].name).toBe("boolValue");
      expect((simpleType.fields[2].type as IntrospectionNamedTypeRef).name).toBe("Boolean");
      expect(simpleType.fields[2].description).toBe("a bool type");

      expect(simpleType.fields[3].name).toBe("date");
      expect((simpleType.fields[3].type as IntrospectionNamedTypeRef).name).toBe("DateTime");
      expect(simpleType.fields[3].description).toBe("a date type");

      expect(simpleType.fields[4].name).toBe("arrStr");
      expect(((simpleType.fields[4].type as IntrospectionListTypeRef).ofType as IntrospectionNamedTypeRef).name).toBe("String");
      expect((simpleType.fields[4].type as IntrospectionListTypeRef).kind).toBe("LIST");
      expect(simpleType.fields[4].description).toBe("an array of string type");

      expect(simpleType.fields[5].name).toBe("scalarMap");
      expect((simpleType.fields[5].type as IntrospectionNamedTypeRef).name).toBe("ID");
      expect(simpleType.fields[5].description).toBe("a scalar type");
    });

    it("ObjectType should make a relationship", async () => {
      @ObjectType()
      class ObjectTypeRelationship {
        @Field({
          nullable: true
        })
        toType: SimpleObjectType;

        @Field({
          nullable: true
        })
        toInterface: SimpleInterfaceType;

        @Field(type => enumFromTypeCreator, {
          nullable: true
        })
        toEnumTypeCreator: enumType;

        @Field({
          nullable: true
        })
        toEnumClass: SimpleEnumClassType;

        @Field(type => unionType, {
          nullable: true
        })
        toUnion: SimpleObjectType | ObjectTypeForUnion;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "ObjectTypeRelationship") as IntrospectionObjectType;

      expect(simpleType.kind).toBe(TypeKind.OBJECT);

      expect(simpleType.fields[0].name).toBe("toType");
      expect((simpleType.fields[0].type as IntrospectionNamedTypeRef).name).toBe("SimpleType");

      expect(simpleType.fields[1].name).toBe("toInterface");
      expect((simpleType.fields[1].type as IntrospectionNamedTypeRef).name).toBe("SimpleInterface");

      expect(simpleType.fields[2].name).toBe("toEnumTypeCreator");
      expect((simpleType.fields[2].type as IntrospectionNamedTypeRef).name).toBe("SimpleEnumTypeCreator");

      expect(simpleType.fields[3].name).toBe("toEnumClass");
      expect((simpleType.fields[3].type as IntrospectionNamedTypeRef).name).toBe("SimpleEnumClass");

      expect(simpleType.fields[4].name).toBe("toUnion");
      expect((simpleType.fields[4].type as IntrospectionNamedTypeRef).name).toBe("UnionType");
    });

    it("InterfaceType should make a relationship", async () => {
      @InterfaceType()
      class InterfaceTypeRelationship {
        @Field({
          nullable: true
        })
        toType: SimpleObjectType;

        @Field({
          nullable: true
        })
        toInterface: SimpleInterfaceType;

        @Field(type => enumFromTypeCreator, {
          nullable: true
        })
        toEnumTypeCreator: enumType;

        @Field({
          nullable: true
        })
        toEnumClass: SimpleEnumClassType;

        @Field(type => unionType, {
          nullable: true
        })
        toUnion: SimpleObjectType | ObjectTypeForUnion;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "InterfaceTypeRelationship") as IntrospectionInterfaceType;

      expect(simpleType.kind).toBe(TypeKind.INTERFACE);

      expect(simpleType.fields[0].name).toBe("toType");
      expect((simpleType.fields[0].type as IntrospectionNamedTypeRef).name).toBe("SimpleType");

      expect(simpleType.fields[1].name).toBe("toInterface");
      expect((simpleType.fields[1].type as IntrospectionNamedTypeRef).name).toBe("SimpleInterface");

      expect(simpleType.fields[2].name).toBe("toEnumTypeCreator");
      expect((simpleType.fields[2].type as IntrospectionNamedTypeRef).name).toBe("SimpleEnumTypeCreator");

      expect(simpleType.fields[3].name).toBe("toEnumClass");
      expect((simpleType.fields[3].type as IntrospectionNamedTypeRef).name).toBe("SimpleEnumClass");

      expect(simpleType.fields[4].name).toBe("toUnion");
      expect((simpleType.fields[4].type as IntrospectionNamedTypeRef).name).toBe("UnionType");
    });

    it("InputType should make a relationship", async () => {
      @InputType()
      class InputTypeRelationship {
        @Field({
          nullable: true
        })
        toInput: SimpleInputType;

        @Field(type => enumFromTypeCreator, {
          nullable: true
        })
        toEnumTypeCreator: enumType;

        @Field({
          nullable: true
        })
        toEnumClass: SimpleEnumClassType;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "InputTypeRelationship") as IntrospectionInputObjectType;

      expect(simpleType.kind).toBe(TypeKind.INPUT_OBJECT);

      expect(simpleType.inputFields[0].name).toBe("toInput");
      expect((simpleType.inputFields[0].type as IntrospectionNamedTypeRef).name).toBe("SimpleInput");

      expect(simpleType.inputFields[1].name).toBe("toEnumTypeCreator");
      expect((simpleType.inputFields[1].type as IntrospectionNamedTypeRef).name).toBe("SimpleEnumTypeCreator");

      expect(simpleType.inputFields[2].name).toBe("toEnumClass");
      expect((simpleType.inputFields[2].type as IntrospectionNamedTypeRef).name).toBe("SimpleEnumClass");
    });

    it("InputType should make a relationship to InputType with a class with multiple gqlType", async () => {
      @InputType()
      class InputTypeRelationshipMultiple {
        @Field({
          nullable: true
        })
        toInput: ThreeTypes;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "InputTypeRelationshipMultiple") as IntrospectionInputObjectType;

      expect((simpleType.inputFields[0].type as IntrospectionNamedTypeRef).name).toBe("GraphQLInputObjectTypeThreeTypes");
    });

    it("ObjectType should make a relationship to ObjectType with a class with multiple gqlType", async () => {
      @ObjectType()
      class ObjectTypeRelationshipMultiple {
        @Field({
          nullable: true
        })
        toType: ThreeTypes;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "ObjectTypeRelationshipMultiple") as IntrospectionObjectType;

      expect((simpleType.fields[0].type as IntrospectionNamedTypeRef).name).toBe("GraphQLObjectTypeThreeTypes");
    });

    it("InterfaceType should make a relationship to ObjectType with a class with multiple gqlType", async () => {
      @InterfaceType()
      class InterfaceTypeRelationshipMultiple {
        @Field({
          nullable: true
        })
        toInterface: ThreeTypes;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "InterfaceTypeRelationshipMultiple") as IntrospectionInterfaceType;

      expect((simpleType.fields[0].type as IntrospectionNamedTypeRef).name).toBe("GraphQLObjectTypeThreeTypes");
    });

    it("InterfaceType should make a relationship to InterfaceType (by forcing it) with a class with multiple gqlType", async () => {
      @InterfaceType()
      class InterfaceTypeRelationshipMultipleForced {
        @Field({
          nullable: true,
          gqlType: GraphQLInterfaceType
        })
        toInterface: ThreeTypes;
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      // tslint:disable-next-line:max-line-length
      const simpleType = schema.types.find((schemaType) => schemaType.name === "InterfaceTypeRelationshipMultipleForced") as IntrospectionInterfaceType;

      expect((simpleType.fields[0].type as IntrospectionNamedTypeRef).name).toBe("GraphQLInterfaceTypeThreeTypes");
    });
  });

  describe("Query", () => {
    it("Should create a field resolver with args", async () => {
      @ObjectType()
      class Fieldresolver {
        @Field(type => String, {
          nullable: true
        })
        resolve(
          @Arg({
            defaultValue: "abc",
            description: "arg a",
            name: "first",
            nullable: true
          })
          a: String,
          @Arg({
            defaultValue: 123,
            description: "arg b",
            name: "second",
            nullable: true
          })
          b: Number,
          context: IContext
        ): String {
          return a + b.toString();
        }
      }

      await Rakkit.start();
      const schema = (await graphql<IntrospectionQuery>(MetadataStorage.Instance.Gql.Schema, getIntrospectionQuery())).data.__schema;
      const simpleType = schema.types.find((schemaType) => schemaType.name === "Fieldresolver") as IntrospectionObjectType;

      expect(simpleType.fields[0].args).toHaveLength(2);
      expect(simpleType.fields[0].name).toBe("resolve");
      expect((simpleType.fields[0].type as IntrospectionNamedTypeRef).name).toBe("String");

      expect(simpleType.fields[0].args[0].defaultValue).toBe("\"abc\"");
      expect(simpleType.fields[0].args[0].description).toBe("arg a");
      expect(simpleType.fields[0].args[0].name).toBe("first");
      expect((simpleType.fields[0].args[0].type as IntrospectionNamedTypeRef).name).toBe("String");

      expect(simpleType.fields[0].args[1].defaultValue).toBe("123");
      expect(simpleType.fields[0].args[1].description).toBe("arg b");
      expect(simpleType.fields[0].args[1].name).toBe("second");
      expect((simpleType.fields[0].args[1].type as IntrospectionNamedTypeRef).name).toBe("Float");
    });

    it("Should get correct response from resolver", async () => {
      @Resolver()
      class ResolverA {
        @Query({
          nullable: true
        })
        resolveA(
          @Arg({
            name: "first",
            nullable: true
          })
          a: string
        ): String {
          return a;
        }
      }

      @Resolver()
      class ResolverB {
        @Query(type => String, {
          nullable: true,
          name: "resolveB"
        })
        async resolve(
          @Arg({ name: "second" })
          b: string,
          context: IContext<String>
        ) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          context.gql.response = `hello ${b}`;
        }
      }

      @Resolver()
      class ResolverC {
        @Query(type => String, {
          nullable: true,
          name: "resolveC"
        })
        async resolve(
          @Arg({ name: "second" })
          c: string,
          context: IContext<String>
        ) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          context.response.body = `${c} world`;
        }
      }

      await Rakkit.start({
        forceStart: ["rest", "gql"]
      });

      const server = new ApolloServer({
        schema: MetadataStorage.Instance.Gql.Schema,
        context: ({ctx}) => ({
          ...ctx
        })
      });
      server.applyMiddleware({
        app: Rakkit.Instance.KoaApp
      });

      const resA = await Axios.post("http://localhost:4000/graphql", {
        query: 'query { resolveA(first: "hello world") }'
      });
      const resB = await Axios.post("http://localhost:4000/graphql", {
        query: 'query { resolveB(second: "world") }'
      });
      const resC = await Axios.post("http://localhost:4000/graphql", {
        query: 'query { resolveC(second: "hello") }'
      });

      expect(resA.data.data).toEqual({
        resolveA: "hello world"
      });
      expect(resB.data.data).toEqual({
        resolveB: "hello world"
      });
      expect(resC.data.data).toEqual({
        resolveC: "hello world"
      });
    });
  });
});