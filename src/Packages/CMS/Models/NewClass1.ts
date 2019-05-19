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
export class NewClass1 {
  @PrimaryGeneratedColumn()
  ID: number;
  @Column({ type: String, nullable: false })
  NewField1: string;
  @Column({ type: String, nullable: false })
  NewField2: string;
}
