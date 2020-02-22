import { BaseEntity, Entity, ManyToOne, Column, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectType, Field } from "../../../../../src";
import { MangaModel } from "./MangaModel";
import { LangModel } from "./LangModel";

@ObjectType()
@Entity()
export class ChapterModel extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @ManyToOne(type => MangaModel, manga => manga.chapters)
  manga: MangaModel;

  @Field()
  @Column()
  number: number;

  @Field()
  @ManyToOne(type => LangModel, lang => lang.chapters)
  lang: LangModel;

  @Field()
  @Column()
  link: string;

  @Field()
  @Column()
  colored: boolean;

  @Field()
  @Column()
  published: boolean;
}
