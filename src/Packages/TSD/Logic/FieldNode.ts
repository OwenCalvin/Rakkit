import { Node } from "./Node";
import {
  Accessor,
  IFieldNode,
  Decorator,
  IRelation,
  ClassNode
} from "..";

export class FieldNode extends Node implements IFieldNode {
  private _accessors: Accessor[] = [];
  private _typeName: string;
  private _isArray: boolean;
  private _isNullable: boolean;
  private _defaultValue?: any;
  private _primary: boolean;
  private _relation: IRelation;

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

  static parseObjects(objs: ArrayLike<IFieldNode>) {
    return super.genericParseObjects(FieldNode, objs);
  }

  ToObject(): IFieldNode {
    return {
      Name: this.Name,
      Primary: this.Primary,
      IsArray: this.IsArray,
      Relation: this.Relation,
      TypeName: this.TypeName,
      Accessors: this.Accessors,
      IsNullable: this.IsNullable,
      DefaultValue: this.DefaultValue,
      Decorators: this.Decorators.map((decorator) => decorator.ToObject())
    };
  }

  ParseObject(obj: IFieldNode) {
    const relationClass = new ClassNode();
    const relationField = new FieldNode();
    relationClass.ParseObject(obj.Relation.ClassNode);
    relationField.ParseObject(obj.Relation.FieldNode);

    this
      .SetName(obj.Name)
      .SetDefaultValue(obj.DefaultValue)
      .SetType(obj.TypeName)
      .AddAccessor(...obj.Accessors)
      .SetIsArray(obj.IsArray)
      .SetIsNullable(obj.IsNullable)
      .SetPrimary(obj.Primary)
      .SetRelation(relationClass, relationField)
      .AddDecorator(...Decorator.parseObjects(obj.Decorators));

    return this;
  }

  SetRelation(classNode: ClassNode, fieldNode: FieldNode) {
    this._relation.ClassNode = classNode;
    this._relation.FieldNode = fieldNode;
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
