import React from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { fileTreeApi } from '../api';

const flattenFiles = (nodes, result = []) => {
    nodes.forEach(node => {
        if (node.type === 'file') result.push(node);
        if (node.children?.length > 0) flattenFiles(node.children, result);
    });
    return result;
};

export default function WikiMarkdown({ content }) {
    const navigate = useNavigate();
    const [allFiles, setAllFiles] = useState([]);

    useEffect(() => {
        async function fetchFileTree() {
            try {
                const tree = await fileTreeApi.getTree();
                setAllFiles(flattenFiles(tree || []));
            } catch (err) {
                console.error('加载文件树失败:', err);
            }
        }
        fetchFileTree();
    }, []);

    const renderContent = (text) => {
        const regex = /\[\[(.*?)\]\]/g;
        const parts = text.split(regex);
        const matches = text.match(regex);

        if (!matches) return <ReactMarkdown>{text}</ReactMarkdown>;

        return (
            <div>
                {parts.map((part, index) => {
                    if (index % 2 === 1) {
                        const title = part;
                        const targetFile = allFiles.find(f => f.title === title);
                        return (
                            <span key={index} onClick={() => targetFile ? navigate(`/knowledge?id=${targetFile.id}`) : alert(`文章未创建`)}
                                className="text-accent font-semibold cursor-pointer hover:underline bg-indigo-50 px-1 rounded mx-0.5 transition-colors">
                                {title}
                            </span>
                        );
                    }
                    return <ReactMarkdown key={index} components={{ p: React.Fragment }}>{part}</ReactMarkdown>;
                })}
            </div>
        );
    };
    return <div className="prose prose-slate max-w-none">{renderContent(content)}</div>;
}