import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  ManyToMany,
  OneToOne
} from "typeorm";

@Entity()
export class NewClass {
  @PrimaryGeneratedColumn()
  ID: number;
  @Column({ type: String, nullable: false })
  NewField: string;
}
