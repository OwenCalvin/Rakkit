import { Resolver, Query, FlatArgs } from "../../../../../src";
import { MangaModel } from '../models';
import { GetArgs, BaseGetArgs } from '../args/GetArgs';

@Resolver()
export class MangaResolver {
  @Query(type => [MangaModel])
  async mangas(
    @FlatArgs(type => GetArgs(MangaModel))
    args: BaseGetArgs<MangaModel>
  ): Promise<MangaModel[]> {
    const res = await MangaModel.find({
      where: args.where,
      skip: args.at,
      take: args.limit
    });
    return res;
  }
}
