import { Node } from "./Node";
import {
  Accessor,
  IFieldNode,
  Decorator,
  ClassNode,
  IRelation
} from "..";

export class FieldNode extends Node implements IFieldNode {
  private _accessors: Accessor[] = [];
  private _typeName: string;
  private _isArray: boolean;
  private _isNullable: boolean;
  private _defaultValue?: any;
  private _primary: boolean;
  private _relation: FieldNode;
  private _classNode: ClassNode;
  private _staticRelation: IRelation;

  get Accessors() {
    return this._accessors;
  }

  get TypeName() {
    return this._typeName;
  }

  get DefaultValue() {
    return this._defaultValue;
  }

  get IsArray() {
    return this._isArray;
  }

  get IsNullable() {
    return this._isNullable;
  }

  get Primary() {
    return this._primary;
  }

  get Relation() {
    return this._relation;
  }

  get ClassNode() {
    return this._classNode;
  }

  get StaticRelation() {
    return this._staticRelation;
  }

  static parseObjects(objs: ArrayLike<IFieldNode>, classNode: ClassNode) {
    const fieldNodes = super.genericParseObjects(FieldNode, objs);
    fieldNodes.map((fieldNode) => {
      fieldNode.SetClassNode(classNode);
    });
    return fieldNodes;
  }

  ToObject(): IFieldNode {
    const obj: IFieldNode = {
      Name: this.Name,
      Primary: this.Primary,
      IsArray: this.IsArray,
      TypeName: this.TypeName,
      Accessors: this.Accessors,
      IsNullable: this.IsNullable,
      DefaultValue: this.DefaultValue,
      Decorators: this.Decorators.map((decorator) => decorator.ToObject())
    };
    if (this._relation) {
      obj.StaticRelation = {
        ClassNodeName: this._relation.ClassNode.Name,
        FieldNodeName: this._relation.ToObject().Name
      };
    }
    return obj;
  }

  ParseObject(obj: IFieldNode) {
    this
      .SetName(obj.Name)
      .SetDefaultValue(obj.DefaultValue)
      .SetType(obj.TypeName)
      .AddAccessor(...obj.Accessors)
      .SetIsArray(obj.IsArray)
      .SetIsNullable(obj.IsNullable)
      .SetPrimary(obj.Primary)
      .AddDecorator(...Decorator.parseObjects(obj.Decorators));

    if (obj.StaticRelation) {
      this.SetStaticRelation(
        obj.StaticRelation.ClassNodeName,
        obj.StaticRelation.FieldNode
      );
    }

    return this;
  }

  SetClassNode(classNode: ClassNode) {
    this._classNode = classNode;
    return this;
  }

  SetStaticRelation(classNodeName: string, fieldNode: IFieldNode) {
    if (classNodeName && fieldNode) {
      this._staticRelation = {};
      this._staticRelation.ClassNodeName = classNodeName;
      this._staticRelation.FieldNodeName = fieldNode.Name;
      this._staticRelation.FieldNode = fieldNode;
    }
    return this;
  }

  SetRelation(fieldNode: FieldNode) {
    this._relation = fieldNode;
    return this;
  }

  SetPrimary(isPrimary: boolean) {
    this._primary = isPrimary;
    return this;
  }

  SetType(type: string | Function) {
    this._typeName = typeof type === "string" ? type : type.name;
    return this;
  }

  SetIsArray(isArray: boolean) {
    this._isArray = isArray;
    return this;
  }

  SetIsNullable(isNullable: boolean) {
    this._isNullable = isNullable;
    return this;
  }

  SetDefaultValue(defaultValue: any) {
    this._defaultValue = defaultValue;
    return this;
  }

  AddAccessor(...accessors: Accessor[]) {
    return this.addToArray(this._accessors, ...accessors);
  }

  RemoveAccessor(accessor: string) {
    return this.removeFromArray(this._accessors, accessor);
  }
}
