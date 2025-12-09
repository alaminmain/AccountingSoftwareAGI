import { useEffect, useState } from 'react';
import api from '../api/client';
import { ChevronRight, ChevronDown, Folder, File, Plus } from 'lucide-react';
import { cn } from '../utils/cn';

interface ChartOfAccount {
    id: number;
    code: string;
    name: string;
    type: number;
    accountLevel: number;
    parentId?: number;
    isControlAccount: boolean;
    children: ChartOfAccount[];
}

const AccountNode = ({ node, level }: { node: ChartOfAccount; level: number }) => {
    const [isOpen, setIsOpen] = useState(true); // Default open for demo
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="select-none">
            <div
                className={cn(
                    "flex items-center gap-2 py-2 px-2 hover:bg-muted/50 rounded-sm cursor-pointer",
                    level === 0 && "font-bold text-lg border-b mt-2",
                    level === 1 && "font-semibold text-md ml-4",
                    level > 1 && `ml-[${level * 20}px] text-sm`
                )}
                style={{ paddingLeft: `${level * 16}px` }}
                onClick={() => setIsOpen(!isOpen)}
            >
                {hasChildren ? (
                    isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                ) : (
                    <div className="w-4 h-4" /> // Spacer
                )}

                {node.isControlAccount ? (
                    <Folder className={cn("w-4 h-4 text-amber-500", level === 0 && "w-5 h-5")} />
                ) : (
                    <File className="w-4 h-4 text-blue-500" />
                )}

                <span className="font-mono text-muted-foreground mr-2">{node.code}</span>
                <span>{node.name}</span>

                <div className="ml-auto opacity-0 group-hover:opacity-100 flex gap-2">
                    {node.isControlAccount && (
                        <button className="p-1 hover:bg-muted rounded" title="Add Child">
                            <Plus className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            {isOpen && hasChildren && (
                <div>
                    {node.children.map(child => (
                        <AccountNode key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}
        </div>
    );
};

export const ChartOfAccounts = () => {
    const [accounts, setAccounts] = useState<ChartOfAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                // In a real tree API, you might get a flat list and build tree, 
                // or get a tree directly if backend supports it.
                // Our generic repository returns flat list. We need to build tree here.
                const res = await api.get('/ChartOfAccounts');
                const flatList = res.data;
                const tree = buildTree(flatList);
                setAccounts(tree);
            } catch (err) {
                console.error("Failed to load COA", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAccounts();
    }, []);

    const buildTree = (items: any[]) => {
        const rootItems: any[] = [];
        const lookup: any = {};

        items.forEach(item => {
            item.children = [];
            lookup[item.id] = item;
        });

        items.forEach(item => {
            if (item.parentId) {
                if (lookup[item.parentId]) {
                    lookup[item.parentId].children.push(item);
                }
            } else {
                rootItems.push(item);
            }
        });

        return rootItems;
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm">
                    New Account
                </button>
            </div>

            <div className="bg-card rounded-xl border border-border shadow-sm p-6 overflow-hidden">
                <div className="flex flex-col">
                    {accounts.map(node => (
                        <AccountNode key={node.id} node={node} level={0} />
                    ))}
                </div>
            </div>
        </div>
    );
};
