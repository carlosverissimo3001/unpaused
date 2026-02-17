import { Transform } from 'class-transformer';

export const TransformToArray = () =>
  Transform(({ value }: { value: string | string[] }) => {
    if (Array.isArray(value)) {
      return value;
    }
    return value?.split(',') || value;
  });
