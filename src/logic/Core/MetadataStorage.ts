import { Rakkit } from "../../Rakkit";
import {
  AppLoader,
  HandlerFunctionHelper
} from "..";
import {
  IDecorator,
  IRouter,
  IEndpoint,
  HttpMethod,
  MiddlewareType,
  IMiddleware,
  MiddlewareExecutionTime,
  IOn,
  HandlerFunction,
  IUsedMiddleware,
  IService,
  IInject,
  IClassType,
  IWebsocket,
  IBaseMiddleware,
  IDiId,
  DiId,
  ReturnedService,
  ApiRouter
} from "../../types";
import { Middleware } from "koa";

export class MetadataStorage {
  //#region Declarations
  private static _instance: MetadataStorage;
  // REST
  private _middlewares: Map<Object, IDecorator<IMiddleware>> = new Map();
  private _beforeMiddlewares: Map<Object, HandlerFunction> = new Map();
  private _afterMiddlewares: Map<Object, HandlerFunction> = new Map();
  private _usedMiddlewares: IDecorator<IUsedMiddleware>[] = [];
  private _routers: Map<Object, IDecorator<IRouter>> = new Map();
  private _endpoints: IDecorator<IEndpoint>[] = [];
  private _compiledRouter: ApiRouter = new ApiRouter();
  // DI
  private _services: IDecorator<IService<any>>[] = [];
  private _injections: IDecorator<IInject>[] = [];
  // WS
  private _websockets: Map<Object, IDecorator<IWebsocket>> = new Map();
  private _ons: IDecorator<IOn>[] = [];
  //#endregion

  //#region Getters
  static get Instance() {
    if (!this._instance) {
      this._instance = new MetadataStorage();
    }
    return this._instance;
  }

  get MainRouter() {
    return this._compiledRouter as Readonly<ApiRouter>;
  }

  get BeforeMiddlewares() {
    return this._beforeMiddlewares as ReadonlyMap<Object, HandlerFunction>;
  }

  get AfterMiddlewares() {
    return this._afterMiddlewares as ReadonlyMap<Object, HandlerFunction>;
  }

  get Middlewares() {
    return this._middlewares as ReadonlyMap<Object, IDecorator<IMiddleware>>;
  }

  get Ons() {
    return this._ons as ReadonlyArray<IDecorator<IOn>>;
  }

  get Endpoints() {
    return this._endpoints as ReadonlyArray<IDecorator<IEndpoint>>;
  }

  get Services() {
    return this._services as ReadonlyArray<IDecorator<IService<any>>>;
  }

  get Routers() {
    return this._routers as ReadonlyMap<Object, IDecorator<IRouter>>;
  }

  get Websockets() {
    return this._websockets as ReadonlyMap<Object, IDecorator<IWebsocket>>;
  }
  //#endregion

  //#region Static methods
  static getAddEndPointDecorator(method: HttpMethod) {
    return (endpoint?: string): Function => {
      return (target: Object, key: string, descriptor: PropertyDescriptor): void => {
        this.Instance.AddEndpoint({
          class: target.constructor,
          key,
          params: {
            endpoint: endpoint || "/",
            method,
            functions: [descriptor.value]
          }
        });
      };
    };
  }

  static getAddMiddlewareDecorator(executionTime: MiddlewareExecutionTime) {
    return (): Function => {
      return (target: Function, key: string, descriptor: PropertyDescriptor): void => {
        const isClass = !key;
        const finalKey = isClass ? target.name : key;
        const finalFunc = isClass ? target : descriptor.value;
        this.Instance.AddMiddleware({
          class: finalFunc,
          key: finalKey,
          params: {
            executionTime,
            function: finalFunc,
            isClass
          }
        });
      };
    };
  }

  static getService(service: IDecorator<IDiId>): ReturnedService<any>;
  static getService<ClassType>(
    classType: ClassType,
    id?: string | number
  ): ReturnedService<ClassType>;
  static getService<ClassType>(
    classtypeOrService: ClassType | IDecorator<IDiId>,
    id?: string | number
  ) {
    const isService = typeof classtypeOrService !== "function";
    const comparedClassType = isService ? (classtypeOrService as IDecorator<any>).class : classtypeOrService;
    const comparedName = isService ? (classtypeOrService as IDecorator<IDiId>).params.id : id;
    const service = this.Instance._services.find((service) =>
      service.class === comparedClassType && service.params.id === comparedName
    );
    if (service) {
      return service.params;
    }
  }


  /**
   * Declare a class as a service, you can inject items and use it as a service
   * @param item
   */
  static addAsService(item: IDecorator<any>): ReturnedService<any>;
  static addAsService<ClassType>(
    classType: ClassType,
    id: DiId
  ): ReturnedService<ClassType>;
  static addAsService<ClassType>(
    itemOrClass: IDecorator<any> | ClassType,
    id?: DiId
  ) {
    const isClass = typeof itemOrClass === "function";
    const classFunc = isClass ? itemOrClass : (itemOrClass as IDecorator<any>).class;
    const instance = new (classFunc as IClassType<ClassType>)();
    const serviceParams = {
      id,
      instance
    };
    const service: IDecorator<IService<any>> = {
      class: classFunc,
      key: classFunc.constructor.name,
      params: serviceParams
    };
    this.Instance.AddService(service);
    return serviceParams;
  }
  //#endregion

  //#region Add-ers
  AddWebsocket(item: IDecorator<IWebsocket>) {
    item.params.namespace = this.normalizePath(item.params.namespace);
    MetadataStorage.addAsService(item);
    this._websockets.set(item.class, item);
  }

  AddRouter(item: IDecorator<IRouter>) {
    item.params.path = this.normalizePath(item.params.path);
    const routerAlreadyExists = this.getRoutersByPath(item.params.path).length >= 1;
    if (routerAlreadyExists) {
      throw new Error(`Multiple routers have the path: ${item.params.path}`);
    } else {
      MetadataStorage.addAsService(item);
      this._routers.set(item.class, item);
    }
  }

  AddMiddleware(item: IDecorator<IMiddleware>) {
    // If middleware is a class, instanciate it and use the "use" method as the middleware
    if (item.params.isClass) {
      const instance = MetadataStorage.addAsService(item).instance;
      item.params.isClass = false;
      item.params.function = (instance as IBaseMiddleware).use.bind(instance);
    }
    switch (item.params.executionTime) {
      case "AFTER":
        this._afterMiddlewares.set(item.class, item.params.function);
      break;
      case "BEFORE":
        this._beforeMiddlewares.set(item.class, item.params.function);
      break;
    }
    this._middlewares.set(item.class, item);
  }

  AddService(item: IDecorator<IService<any>>) {
    const serviceAlreadyExists = MetadataStorage.getService(item);
    if (serviceAlreadyExists) {
      throw new Error(`
        ${(serviceAlreadyExists.instance as Object).constructor.name} with the id "${serviceAlreadyExists.id}"
        is already declared as a service don't decorate it twice.
        @Websocket, @Router, @AfterMiddleware, @BeforeMiddleware is implicitly decorated by @Service
      `);
    } else {
      this._services.push(item);
    }
  }

  AddUsedMiddleware(item: IDecorator<IUsedMiddleware>) {
    this._usedMiddlewares.push(item);
  }

  AddEndpoint(item: IDecorator<IEndpoint>) {
    item.params.endpoint = this.normalizePath(item.params.endpoint);
    this._endpoints.push(item);
  }

  AddOn(item: IDecorator<IOn>) {
    this._ons.push(item);
  }

  AddInjection(item: IDecorator<IInject>) {
    this._injections.push(item);
  }
  //#endregion

  //#region Build
  async BuildAll() {
    this.buildInjections();
    this.buildRouters();
    this.buildWebsockets();
  }

  private buildWebsockets() {
    this._ons.map((item) => {
      const wsClass = this._websockets.get(item.class);
      const duplicates = this._ons.filter((on) => {
        const onClass = this._websockets.get(on.class);
        return (
          item.params.event === on.params.event &&
          wsClass.params.namespace === onClass.params.namespace
        );
      });
      if (duplicates.length > 1) {
        throw new Error(`The "${item.params.event}" @On event with the namespace "${wsClass.params.namespace}" already exists`);
      }
      item.params.function = this.bindContext(wsClass, item.params.function);
      wsClass.params.ons.push(item);
    });
  }

  private buildInjections() {
    this._injections.map((item) => {
      const destinationService = MetadataStorage.getService(item.class, undefined);
      if (destinationService) {
        const services = item.params.ids.reduce((prev, id) => {
          const service = MetadataStorage.getService(item.params.injectionType, id);
          if (service) {
            return [
              ...prev,
              service.instance
            ];
          } else {
            throw new Error(`The service ${item.params.injectionType.name} with the id ${id} doesn't exists`);
          }
        }, []);
        destinationService.instance[item.key] = item.params.isArray ? services : services[0];
      } else {
        throw new Error(`The class ${item.class.constructor.name} should be declared as a service`);
      }
    });
  }

  private async buildRouters() {
    let restRouter = new ApiRouter({ prefix: Rakkit.Instance.Config.restEndpoint });
    this._endpoints.map((item) => {
      const router = this._routers.get(item.class);
      // Look if the endpoint is already merged to another endpoinr
      const alreadyMerged = router.params.endpoints.find(endpoint =>
        endpoint.params.endpoint === item.params.endpoint &&
        endpoint.params.method === item.params.method &&
        endpoint.class === item.class
      );
      item.params.functions = this.getEndpointFunctions(item);
      if (!alreadyMerged) {
        // If multiple method are decorated with the same method and endpoint
        // merge the functions
        const endpointsToMerge = this._endpoints.filter((mergeItem) => {
          return item !== mergeItem &&
            item.class === mergeItem.class &&
            item.params.endpoint === mergeItem.params.endpoint &&
            item.params.method === mergeItem.params.method;
        });
        endpointsToMerge.map((endpoint) => {
          item.params.functions = item.params.functions.concat(this.getEndpointFunctions(endpoint));
        });
        router.params.endpoints.push(item);
      }
    });
    const routers = Array.from(this._routers.values());
    routers.map((item) => {
      // getUsedMiddleware merge
      const mws = this._usedMiddlewares.filter((usedMw) => {
        return (
          usedMw.class === item.class &&
          usedMw.class === usedMw.params.applyOn
        );
      });
      item.params.middlewares = this.extractMiddlewares(mws);
      this.mountEndpointsToRouter(item);
      restRouter.use(
        item.params.path,
        item.params.router.routes(),
        item.params.router.allowedMethods()
      );
    });

    const rootMiddlewares = Rakkit.Instance.Config.globalRootMiddlewares;
    const restMiddlewares = Rakkit.Instance.Config.globalRestMiddlewares;
    restRouter = this.mountMiddlewaresToRouter(
      restMiddlewares,
      restRouter
    );
    this._compiledRouter.use(restRouter.routes());
    this._compiledRouter = this.mountMiddlewaresToRouter(
      rootMiddlewares,
      this._compiledRouter
    );
  }
  //#endregion

  //#region Util methods
  private getUsedMiddlewares(endpoint: IDecorator<IEndpoint>) {
    return this._usedMiddlewares.filter((usedMw) => {
      return (
        usedMw.class === endpoint.class &&
        endpoint.params.functions[0] === usedMw.params.applyOn
      );
    });
  }

  private mountMiddlewaresToRouter(middlewares: MiddlewareType[], router: ApiRouter) {
    const tempRouter = new ApiRouter(router.opts);
    const restBeforeMiddlewares = this.getBeforeMiddlewares(middlewares);
    const restAfterMiddlewares = this.getAfterMiddlewares(middlewares);
    tempRouter.use(...restBeforeMiddlewares);
    tempRouter.use(router.prefix("/").routes());
    tempRouter.use(...restAfterMiddlewares);

    return tempRouter;
  }

  private getEndpointFunctions(endpoint: IDecorator<IEndpoint>) {
    const endpointUsedMiddlewares = this.getUsedMiddlewares(endpoint);
    const endpointMiddlewares = this.extractMiddlewares(endpointUsedMiddlewares);
    const compiledMergedEnpoint: Function[] = [
      ...this.getBeforeMiddlewares(endpointMiddlewares),
      ...this.bindContext(endpoint, endpoint.params.functions),
      ...this.getAfterMiddlewares(endpointMiddlewares)
    ];
    return compiledMergedEnpoint;
  }

  private loadMiddlewares(router: IRouter, middlewares: Map<Object, HandlerFunction>) {
    AppLoader.loadMiddlewares(
      router.middlewares,
      router.router,
      middlewares
    );
  }

  private bindContext(context: IDecorator<any>, fn: Function): Function;
  private bindContext(context: IDecorator<any>, fns: Function[]): Function[];
  private bindContext(context: IDecorator<any>, fnsOrFn: Function[] | Function) : Function[] | Function {
    const instance = MetadataStorage.getService(context).instance;
    if (Array.isArray(fnsOrFn)) {
      return fnsOrFn.map(
        (fn) => fn.bind(instance)
      );
    }
    return fnsOrFn.bind(instance);
  }

  private getBeforeAfterMiddlewares(middlewares: MiddlewareType[], beforeAfter: MiddlewareExecutionTime) {
    return middlewares.reduce<Middleware[]>((arr, item) => {
      let foundMiddleware = this._middlewares.get(item);
      if (!foundMiddleware) {
        foundMiddleware = {
          class: item,
          key: (item as HandlerFunction).name,
          params: {
            executionTime: "BEFORE",
            function: (item as HandlerFunction),
            isClass: false
          }
        };
      }
      if (foundMiddleware.params.executionTime === beforeAfter) {
        return [
          ...arr,
          foundMiddleware.params.function
        ];
      }
      return arr;
    }, []);
  }

  private getBeforeMiddlewares(middlewares: MiddlewareType[]) {
    return this.getBeforeAfterMiddlewares(middlewares, "BEFORE");
  }

  private getAfterMiddlewares(middlewares: MiddlewareType[]) {
    return this.getBeforeAfterMiddlewares(middlewares, "AFTER");
  }

  private mountEndpointsToRouter(router: IDecorator<IRouter>) {
    router.params.router = new ApiRouter();
    this.loadMiddlewares(router.params, this._beforeMiddlewares);
    router.params.endpoints.map((endpoint) => {
      const method = endpoint.params.method.toLowerCase();
      router.params.router[method](
        `${endpoint.params.endpoint}`,
        ...endpoint.params.functions.map(HandlerFunctionHelper.getWrappedHandlerFunction)
      );
    });
    this.loadMiddlewares(router.params, this._afterMiddlewares);
  }

  private extractMiddlewares(arr: IDecorator<IUsedMiddleware>[]): MiddlewareType[] {
    return arr.reduce((prev, curr) => [
      ...prev,
      ...curr.params.middlewares
    ], []);
  }

  /**
   * Normalize the path of a router or an endpoint
   * @param path The path string (example: "/router")
   */
  private normalizePath(path?: string) {
    let finalPath = path ? path.toLowerCase().trim() : "";
    if (finalPath[0] !== "/") {
      finalPath = `/${finalPath}`;
    }
    if (finalPath[finalPath.length - 1] === "/" && finalPath.length > 1) {
      finalPath = finalPath.substr(0, finalPath.length - 2);
    }
    return finalPath;
  }

  /**
   * Get a router by his path
   * @param path The router path
   */
  private getRoutersByPath(path: string) {
    return Array.from(this._routers.values()).filter((router) =>
      router.params.path === path
    );
  }
  //#endregion
}
