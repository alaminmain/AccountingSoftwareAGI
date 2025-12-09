

export const Dashboard = () => {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[
                    { title: "Total Revenue", value: "$45,231.89", change: "+20.1% from last month" },
                    { title: "Subscriptions", value: "+2350", change: "+180.1% from last month" },
                    { title: "Sales", value: "+12,234", change: "+19% from last month" },
                    { title: "Active Now", value: "+573", change: "+201 since last hour" }
                ].map((item, i) => (
                    <div key={i} className="rounded-xl border bg-card text-card-foreground shadow p-6">
                        <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium text-muted-foreground">{item.title}</h3>
                        </div>
                        <div className="text-2xl font-bold">{item.value}</div>
                        <p className="text-xs text-muted-foreground">{item.change}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
