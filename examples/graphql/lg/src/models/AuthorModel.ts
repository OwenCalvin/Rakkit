import { ObjectType, Field } from "../../../../../src";
import { Entity, BaseEntity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { MangaModel } from './MangaModel';

@ObjectType()
@Entity()
export class AuthorModel extends BaseEntity {
  @Field()
  @PrimaryGeneratedColumn()
  id: number

  @Field()
  @Column()
  name: string;

  @Field()
  @Column()
  firstname: string;

  @Field(type => MangaModel)
  @OneToMany(type => MangaModel, manga => manga.author)
  mangas: MangaModel[];
}
