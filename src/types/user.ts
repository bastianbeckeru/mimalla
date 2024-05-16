export type UserProps = {
  email?: string | null;
  name?: string | null;
  image?: string | null;
};

export type CareerProps = {
  siesCode: string;
  name: string;
  faculty: {
    name: string;
    university: {
      name: string;
    };
  };
};

export type GradeProps = {
  id: number;
  name: string;
  value: number | null;
  weight: number;
  excluded: boolean;
  date?: Date;
  subgrades: SubgradeProps[];
};

export type SubgradeProps = {
  id: number;
  name: string;
  value: number | null;
  excluded: boolean;
  date?: Date;
};
