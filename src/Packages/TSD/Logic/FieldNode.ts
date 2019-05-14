import { Node } from "./Node";
import { Accessor, IFieldNode, Decorator } from "..";

export class FieldNode extends Node implements IFieldNode {
  private _accessors: Accessor[] = [];
  private _typeName: string;
  private _isArray: boolean;
  private _isNullable: boolean;
  private _defaultValue?: any;
  private _primary: boolean;

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

  static parseObjects(objs: ArrayLike<IFieldNode>) {
    return super.genericParseObjects(FieldNode, objs);
  }

  ToObject(): IFieldNode {
    return {
      Name: this.Name,
      Primary: this.Primary,
      IsArray: this.IsArray,
      TypeName: this.TypeName,
      Accessors: this.Accessors,
      IsNullable: this.IsNullable,
      DefaultValue: this.DefaultValue,
      Decorators: this.Decorators.map((decorator) => decorator.ToObject())
    };
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
