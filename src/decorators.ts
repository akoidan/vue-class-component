import type {VueBase} from "./vue";

/* eslint-disable */
type ClassType = new (...args: any[]) => any;
type ValueFilterForKey<T extends InstanceType<ClassType>, U> = {
  [K in keyof T]: U extends T[K] ? K : never;
}[keyof T];

export function ApplyGrowlErr<T extends InstanceType<ClassType>>(
  {loadingProperty, errorProperty, allowSpam}: {
    loadingProperty: ValueFilterForKey<T, boolean>;
    errorProperty: ValueFilterForKey<T, string>;
    allowSpam?: true,
  },
) {
  return function (target: T, propertyKey: string, descriptor: PropertyDescriptor) {
    const original = descriptor.value;
    descriptor.value = async function (...args: unknown[]) {
      if ((this as any)[loadingProperty] && !allowSpam && (this as VueBase).$logger) {
        (this as VueBase).$logger.warn("Skipping {} as it's loading", descriptor.value)();
        return;
      }
      try {
        (this as any)[loadingProperty] = true;
        (this as any)[errorProperty] = null;
        const a = await original.apply(this, args);
        if (errorProperty) {
          (this as any)[errorProperty] = "";
        }
        return a;
        // @ts-expect-error: TS1196
      } catch (e: Error) {
        let strError;
        if (e) {
          if (e.message) {
            strError = e.message;
          } else if (e.error) {
            strError = String(e.error);
          } else {
            strError = String(e);
          }
        } else {
          e = "Unknown error";
        }
        if (target.$logger)
        target.$logger.error(`Error during ${propertyKey} {}`, e)();
        (this as any)[errorProperty] = strError;
      } finally {
        if (loadingProperty) {
          (this as any)[loadingProperty] = false;
        }
      }
    };
  };
}

export function stateDecoratorFactory<TPT extends G, G>(vuexModule: TPT):
  <TCT extends (TCT[TPN] extends TPT[TPN] ? unknown : never), TPN extends (keyof TCT & keyof TPT)>
  (vueComponent: TCT, fileName: TPN) => void {
  return <TCT extends (TCT[TPN] extends TPT[TPN] ? unknown : never), TPN extends (keyof TCT & keyof TPT)>
  (vueComponent: TCT, fileName: TPN): void => {
    Object.defineProperty(
      vueComponent,
      fileName,
      Object.getOwnPropertyDescriptor(
        vuexModule,
        fileName,
      )!,
    );
  };
}