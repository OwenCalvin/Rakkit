import {
  IClassNode,
  ClassNode,
  TSD,
  Decorator,
  Import,
  FieldNode,
  TsCodeWriter
} from "../../TSD";
import {
  Router,
  Post,
  IContext,
  Get,
  Delete
} from "../..";

@Router("/cms")
export class ClassCreatorRouter {
  private _tsd: TSD;

  constructor() {
    this._tsd = new TSD();
    this._tsd.WriteLoadedClasses();
  }

  @Post("/")
  private createClass(context: IContext<IClassNode>) {
    const classNodeObject: IClassNode = context.request.body;
    const editName = classNodeObject.ReceivedName;

    if (classNodeObject) {
      const classNode = new ClassNode();

      if (editName !== classNode.Name) {
        this._tsd.Remove(editName);
      }

      classNode
        .ParseObject(classNodeObject)
        .SetImports([])
        .SetPath(`${__dirname}/../Models/${classNode.Name}.ts`);

      // Parse relation
      // classNode.Fields.map((field) => {
      //   if (field.StaticRelation) {
      //     this._tsd.LoadedClasses.map((classNodeRelation) => {
      //       if (field.TypeName === classNodeRelation.Name) {
      //         let relationField = classNodeRelation.Fields.find((fieldRelation) => {
      //           return fieldRelation.Name === field.StaticRelation.FieldNodeName;
      //         });
      //         if (!relationField) {
      //           relationField = new FieldNode();
      //           classNodeRelation.AddField(relationField);
      //         }
      //         relationField.ParseObject(field.StaticRelation.FieldNode);
      //         field.SetRelation(relationField);
      //       }
      //     });
      //   }
      // });

      this.templateClass(classNode);
      this._tsd.Write(classNode, false);
      this._tsd.WriteSchemaFile();

      context.body = this.sendableClass(classNode);
    } else {
      context.body = this.msg("fill");
      context.status = 403;
    }
  }

  @Delete("/:name")
  private async delete(context: IContext<IClassNode>) {
    const name = context.params.name;
    if (name) {
      const removed = await this._tsd.Remove(name);
      if (removed) {
        context.body = this.sendableClass(removed);
      } else {
        context.status = 404;
        context.body = "notfound";
      }
    } else {
      context.status = 403;
      context.body = this.msg("fill");
    }
  }

  @Post("/restart")
  private restart(context: IContext) {
    process.exit(1);
  }

  @Get("/")
  private classes(context: IContext) {
    context.body = this._tsd.LoadedClassesObject;
  }

  @Get("/health")
  private health(context: IContext) {
    context.body = "ok";
  }

  private msg(msg: string) {
    return {
      msg
    };
  }

  private sendableClass(classNode: ClassNode) {
    return Object.assign({}, classNode.ToObject(), { Path: undefined });
  }

  /**
   * Normalize a classNode
   * @param classNode The classNode
   */
  private templateClass(classNode: ClassNode) {
    const typeOrmImport = new Import("typeorm");
    const decorators = [
      "Entity",
      "Column",
      "PrimaryGeneratedColumn",
      "OneToMany",
      "ManyToOne",
      "ManyToMany",
      "OneToOne"
    ];

    const typeOrmImportExists = classNode.Imports.find((classNodeImport) =>
      classNodeImport.Name === typeOrmImport.Name
    );

    if (!typeOrmImportExists) {
      typeOrmImport.AddImport(
        ...decorators.map<[string]>((importKey) => [importKey])
      );

      classNode.AddImport(typeOrmImport);
    }

    classNode.SetDecorators([]);
    classNode.AddDecorator(new Decorator("Entity"));

    let primaryDone = false;

    // Remove duplicated field
    classNode.Fields.reduce<FieldNode[]>((prev, field) => {
      if (field.Name) {
        const remove = classNode.Fields.find((field2) => {
          return (field.Name === field2.Name || (field.Primary && field2.Primary)) && field !== field2;
        });
        if (remove) {
          const removeExists = prev.find((field) => field.Name === remove.Name);
          if (removeExists) {
            prev[prev.indexOf(removeExists)] = remove;
          } else {
            prev.push(remove);
          }
        }
      } else {
        prev.push(field);
      }
      return prev;
    }, []).map((toRemove) => {
      classNode.Fields.splice(classNode.Fields.indexOf(toRemove), 1);
    });

    // Add primary key at class creation
    if (classNode.Fields.length < 1) {
      const primaryField = new FieldNode("ID");
      this.setFieldPrimary(primaryField);
      classNode.AddField(primaryField);
    }

    classNode.Fields.map((field) => {
      field.SetDecorators([]);
      if (field.Primary && !primaryDone) {
        this.setFieldPrimary(field);
        primaryDone = true;
      } else {
        if (field.Relation) {
          let decorator: Decorator;
          if (field.IsArray) {
            decorator = new Decorator("OneToMany");
          } else {
            decorator = new Decorator("ManyToOne");
          }
          decorator.AddArgument(`type => ${field.Relation.ClassNode.Name}`);
          field.AddDecorator(decorator);
        } else {
          const columnDecorator = new Decorator("Column");
          const codeWriter = new TsCodeWriter();
          const typeName = this.pascalCase(field.TypeName);
          codeWriter.Write(`{ type: ${typeName}, nullable: ${field.IsNullable} }`);
          columnDecorator.AddArgument(codeWriter.Text);
          field.AddDecorator(columnDecorator);
        }
      }
    });
  }

  private setFieldPrimary(field: FieldNode) {
    field
      .AddDecorator(new Decorator("PrimaryGeneratedColumn"))
      .SetType("number")
      .SetIsArray(false)
      .SetIsNullable(false)
      .SetPrimary(true);
    return field;
  }

  private pascalCase(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}
