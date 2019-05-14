import {
  relative,
  dirname,
  parse
} from "path";
import {
  writeFile,
  readFile,
  readFileSync
} from "fs";
import {
  ClassNode,
  IClassNode,
  Import
} from "..";

export class TSD {
  private _tabSize: number;
  private _loadedClasses: ClassNode[] = [];
  private _schemaFile: string = "./schema.json";

  get LoadedClasses() {
    return this._loadedClasses;
  }

  get TabSize() {
    return this._tabSize;
  }

  get LoadedClassesObject() {
    return this._loadedClasses.map((loadedClass) => {
      const rawLoadedClass = loadedClass.ToObject();
      delete rawLoadedClass.Path;
      return rawLoadedClass;
    });
  }

  constructor() {
    this.Load();
  }

  AddLoadedClass(...classNodes: ClassNode[]) {
    this._loadedClasses = this._loadedClasses.concat(classNodes);
    return this;
  }

  Load() {
    try {
      const fileContent = readFileSync(this._schemaFile, "utf8");
      if (fileContent) {
        const classNodes: IClassNode[] = JSON.parse(fileContent);
        this._loadedClasses = ClassNode.parseObjects(classNodes);
      }
    } catch (err) {
    }
  }

  async Write(classNode: ClassNode, persist: boolean = true) {
    if (classNode.Path) {
      const classExistsIndex = this._loadedClasses.findIndex((foundClassNode) =>
        (foundClassNode.Path === classNode.Path || foundClassNode.Name === classNode.Name) &&
        foundClassNode !== classNode
      );
      if (classExistsIndex > -1) {
        this._loadedClasses[classExistsIndex] = classNode;
      }
      classNode.AddImport(...this.getFieldImports(classNode));
      await this.writeFile(classNode.Path, classNode.Content);
      if (persist) {
        return await this.WriteSchemaFile();
      }
    } else {
      throw new Error(`Set a path to class: ${classNode.Name}`);
    }
  }

  async WriteSchemaFile() {
    return await this.writeFile(
      this._schemaFile,
      JSON.stringify(this._loadedClasses.map((loadedClass) => loadedClass.ToObject()))
    );
  }

  async WriteLoadedClasses() {
    const promises = this.LoadedClasses.map((loadedClass) => {
      return this.Write(loadedClass, false);
    });
    return Promise.all(promises);
  }

  SetTabSize(tabSize: number) {
    this._tabSize = tabSize;
    return this;
  }

  private getFieldImports(classNode: ClassNode) {
    return classNode.Fields.reduce<Import[]>((prev, field) => {
      const relation = this._loadedClasses.find((loadedClass) =>
        loadedClass.Name === field.TypeName && loadedClass.Name !== classNode.Name
      );
      if (relation) {
        const importPathInfos = parse(
          relative(
            dirname(classNode.Path),
            relation.Path
          )
        );
        const dir = importPathInfos.dir;
        const importPath = `./${dir ? `${dir}/` : ""}${importPathInfos.name}`;
        const importExists = classNode.Imports.find((foundImport) =>
          foundImport.Name === importPath
        );
        if (!importExists) {
          const newImport = new Import();
          newImport
            .SetName(importPath)
            .AddImport([relation.Name]);

          return [
            ...prev,
            newImport
          ];
        }
      }
      return prev;
    }, []);
  }

  private readFile(path: string) {
    return new Promise<string>((resolve, reject) => {
      readFile(
        path,
        "utf8",
        (err, content) => {
          if (err) {
            reject(err);
          } else {
            resolve(content);
          }
        }
      );
    });
  }

  private writeFile(path: string, content: string) {
    return new Promise<string>((resolve, reject) => {
      writeFile(
        path,
        content,
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(content);
          }
        }
      );
    });
  }
}
