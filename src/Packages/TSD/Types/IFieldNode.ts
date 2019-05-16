import {
  Accessor,
  INode,
  IRelation
} from "..";

export interface IFieldNode extends INode {
  Accessors: Accessor[];
  TypeName: string;
  DefaultValue: any;
  IsArray: boolean;
  IsNullable: boolean;
  Primary: boolean;
  StaticRelation?: IRelation;
}
