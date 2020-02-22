import { ObjectType, Field, GQLInputType, TypeCreator, IClassType, InputType } from '../../../../../src';

@ObjectType()
export abstract class BaseGetArgs<ClassType> {
  @Field({ nullable: true })
  limit: number;

  @Field({ nullable: true })
  at: number;

  where: Partial<ClassType>;
}

export function GetArgs<ClassType extends IClassType>(classType: ClassType) {
  const partialClassType = TypeCreator.CreatePartial(classType, {
    gqlType: GQLInputType
  });

  @InputType()
  class GetArgs extends BaseGetArgs<ClassType> {
    @Field(type => partialClassType, {
      nullable: true
    })
    where: Partial<ClassType>;
  }

  return GetArgs as any;
}
