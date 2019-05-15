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
export class Class1 {
  @PrimaryGeneratedColumn()
  NewField: number;
  @Column({ type: Class1, nullable: false })
  NewField2: class1;
}
