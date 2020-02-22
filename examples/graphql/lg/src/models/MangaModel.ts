import { ObjectType, Field, InputType } from "../../../../../src";
import { Entity, Column, BaseEntity, OneToMany, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { ChapterModel } from "./ChapterModel";
import { AuthorModel } from "./AuthorModel";

@Entity()
@ObjectType()
@InputType()
export class MangaModel extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  thumb: string;

  @Field()
  @Column()
  published: boolean;

  @Field()
  @Column()
  position: number;

  @Field()
  @Column()
  shortStory: string;

  @Field()
  @ManyToOne(type => AuthorModel, author => author.mangas)
  author: AuthorModel;

  @Field(type => ChapterModel)
  @OneToMany(type => ChapterModel, chapter => chapter.manga)
  chapters: ChapterModel[];

  @Field()
  get slug() {
    return this.name.toLowerCase().replace(" ", "-");
  }
}
