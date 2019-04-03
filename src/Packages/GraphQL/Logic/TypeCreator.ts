import {
  GraphQLEnumValueConfigMap,
  GraphQLEnumType,
  GraphQLUnionType,
  GraphQLObjectType
} from "graphql";
import {
  ICreateParams,
  DecoratorHelper,
  GqlType,
  MetadataStorage,
  IField,
  ICustomTypeCreatorParams
} from "../../..";

export class TypeCreator {
  /**
   * Create a Union Type from an existing enum (TS)
   * @param enumType The union type
   * @param params The type paramaters
   */
  static CreateEnum<EnumType extends Object>(
    enumType: EnumType,
    params?: ICreateParams
  ) {
    const values: GraphQLEnumValueConfigMap = {};
    const generatedName = Object.entries(enumType).reduce((prev, [key, value]) => {
      values[key] = {
        value
      };
      return prev + key;
    }, "");
    const definedParams = params || {};
    const definedName = definedParams.name || generatedName;
    const gqlTypeDef = this.createGqlTypeDef(
      definedName,
      GraphQLEnumType
    );
    gqlTypeDef.params.enumValues = values;

    MetadataStorage.Instance.Gql.AddType(gqlTypeDef);

    // Musts return the class to resolve the type in the app
    return gqlTypeDef.class;
  }

  /**
   * Create a GraphQL UnionType from existing types (Equivalent to (TS): YourType1 | YourType2)
   * @param params The type parameters
   * @param types The types with which you will create the union
   */
  static CreateUnion(params: ICreateParams, ...types: Function[]);
  static CreateUnion(types: Function[]);
  static CreateUnion(paramsOrTypes?: ICreateParams | Function[], ...types: Function[]) {
    const isTypes = Array.isArray(paramsOrTypes);
    const definedParams: ICreateParams = isTypes ? {} : paramsOrTypes as ICreateParams;
    const definedTypes = isTypes ? paramsOrTypes as Function[] : types;
    const basicName = definedTypes.reduce((prev, classType) =>
      prev + classType.name
    , "");

    const gqlTypeDef = this.createGqlTypeDef(
      definedParams.name || `union${basicName}`,
      GraphQLUnionType
    );
    gqlTypeDef.params.unionTypes = definedTypes;

    MetadataStorage.Instance.Gql.AddType(gqlTypeDef);

    // Musts return the class to resolve the type in the app
    return gqlTypeDef.class;
  }

  /**
   * Create a Partial type from an another type (Equivalent to (TS): Partial<Type>)
   * @param target The target class
   * @param params The creation options
   */
  static CreateRequired(target: Function);
  static CreateRequired(target: Function, params: ICustomTypeCreatorParams);
  static CreateRequired(
    target: Function,
    params?: ICustomTypeCreatorParams
  ) {
    const definedParams = params || {};
    return this.createTransformation(
      target,
      "Required",
      { nullable: false },
      definedParams.gqlType,
      definedParams.name
    );
  }

  /**
   * Create a Required type from an another type (Equivalent to (TS): Required<Type>)
   * @param target The target class
   * @param params The creation options
   */
  static CreatePartial(target: Function);
  static CreatePartial(target: Function, params: ICustomTypeCreatorParams);
  static CreatePartial(
    target: Function,
    params?: ICustomTypeCreatorParams
  ) {
    const definedParams = params || {};
    return this.createTransformation(
      target,
      "Partial",
      { nullable: true },
      definedParams.gqlType,
      definedParams.name
    );
  }

  /**
   * Generic method to create transformed type
   */
  private static createTransformation<Type extends GqlType = typeof GraphQLObjectType>(
    target: Function,
    prefix: string,
    fieldsTransformation: Partial<IField>,
    gqlType?: Type,
    name?: string
  ): Function {
    const gqlTypeDef = this.createGqlTypeDef(
      name || target.name,
      gqlType
    );
    gqlTypeDef.params.transformation = {
      prefix: name ? undefined : prefix,
      target,
      rootTransformation: {},
      fieldsTransformation: {
        params: fieldsTransformation
      }
    };
    MetadataStorage.Instance.Gql.AddType(gqlTypeDef);
    return gqlTypeDef.class;
  }

  /**
   * Create an artificial GqlTypeDef at runtime
   * @param name The gqlTypeDef name
   * @param gqlType The GraphQL Type
   */
  private static createGqlTypeDef<Type extends GqlType>(
    name: string,
    gqlType: Type
  ) {
    return DecoratorHelper.getAddTypeParams<Type>(
      () => name,
      gqlType,
      name,
      {}
    );
  }
}
