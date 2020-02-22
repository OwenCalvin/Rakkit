import { ObjectType, Field } from "../../../../../src";
import { Entity, Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ChapterModel } from './ChapterModel';

@ObjectType()
@Entity()
export class LangModel {
  @Field()
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column()
  langName: string;

  @Field()
  @Column()
  shortName: string;

  @Field(type => ChapterModel)
  @OneToMany(type => ChapterModel, chapter => chapter.lang)
  chapters: ChapterModel[];
}
