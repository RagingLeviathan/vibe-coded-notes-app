import React from 'react';

interface SourceOriginsProps {
    takenFromCopybook?: boolean;
    takenFromBook?: boolean;
}

const SourceOrigins: React.FC<SourceOriginsProps> = ({ takenFromCopybook, takenFromBook }) => {
    if (!takenFromCopybook && !takenFromBook) return null;
    return (
        <div className="source-origins">
            {takenFromCopybook && <span>Taken from copybook</span>}
            {takenFromBook && <span>Taken from book directly</span>}
        </div>
    );
};

export default SourceOrigins;
