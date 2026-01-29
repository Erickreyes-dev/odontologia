import { Card, CardContent } from "@/components/ui/card";

interface HeaderComponentProps {
  screenName: string;
  description: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export default function HeaderComponent({ screenName, description, Icon }: HeaderComponentProps) {
  return (
    <Card className="w-full my-4 ">
      <CardContent className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-4 p-4 md:p-6">
        {Icon && <Icon className="h-10 w-10 md:h-12 md:w-12 text-primary" aria-hidden="true" />}
        <div className="text-left">
          <h2 className="text-xl md:text-2xl font-bold">{screenName}</h2>
          <p className="text-sm md:text-base text-muted-foreground">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
