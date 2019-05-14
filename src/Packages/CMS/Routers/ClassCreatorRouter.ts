import {
  IClassNode,
  ClassNode,
  TSD,
  Decorator,
  Import,
  FieldNode,
  Accessor
} from "../../TSD";
import {
  Router,
  Post,
  IContext,
  Get
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
    const classNodeObjects: IClassNode[] = context.request.body;

    if (classNodeObjects) {
      const classNodes = classNodeObjects.map((classNodeObject) => {
        const classNode = new ClassNode();
        classNode.ParseObject(classNodeObject);
        classNode.SetImports([]);
        classNode.SetPath(`${__dirname}/../Models/${classNode.Name}.ts`);
        this.templateClass(classNode);

        this._tsd.Write(classNode, false);

        return classNode;
      });

      this._tsd.WriteSchemaFile();

      context.body = Object.assign({}, classNodes[0].ToObject(), { Path: undefined });
    } else {
      context.body = "fill:classnode";
      context.status = 403;
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

  private templateClass(classNode: ClassNode) {
    const typeOrmImport = new Import("typeorm");
    const decorators = new Map([
      ["Entity", new Decorator("Entity")],
      ["Column", new Decorator("Column")],
      ["PrimaryGeneratedColumn", new Decorator("PrimaryGeneratedColumn")],
      ["OneToMany", new Decorator("OneToMany")],
      ["ManyToOne", new Decorator("ManyToOne")],
      ["ManyToMany", new Decorator("ManyToMany")],
      ["OneToOne", new Decorator("OneToOne")]
    ]);

    const typeOrmImportExists = classNode.Imports.find((classNodeImport) =>
      classNodeImport.Name === typeOrmImport.Name
    );

    if (!typeOrmImportExists) {
      typeOrmImport.AddImport(
        ...Array.from(decorators.keys()).map<[string]>((importKey) => [importKey])
      );

      classNode.AddImport(typeOrmImport);
    }

    classNode.SetDecorators([]);
    classNode.AddDecorator(decorators.get("Entity"));

    let primaryDone = false;

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

    if (classNode.Fields.length > 0) {
      const primaryExists = classNode.Fields.find((field) => field.Primary);

      if (!primaryExists) {
        classNode.Fields[0].SetPrimary(true);
      }

      classNode.Fields.map((field) => {
        field.SetDecorators([]);
        if (field.Primary && !primaryDone) {
          field
            .AddDecorator(decorators.get("PrimaryGeneratedColumn"))
            .SetType("number")
            .SetIsArray(false)
            .SetIsNullable(false)
            .SetPrimary(true);
          primaryDone = true;
        } else {
          field
            .SetPrimary(false)
            .AddDecorator(decorators.get("Column"));
        }
      });
    }
  }
}
