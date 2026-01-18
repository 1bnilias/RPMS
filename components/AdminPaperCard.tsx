// Helper component for rendering a paper card
const PaperCard = ({ paper, onClick }: { paper: PaperWithReviews; onClick: () => void }) => (
    <div
        id={`paper-${paper.id}`}
        onClick={onClick}
        className="border dark:border-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer group"
    >
        <div className="flex justify-between items-start mb-3">
            <div>
                <h3 className="font-semibold dark:text-white group-hover:text-red-600 transition-colors">{paper.title}</h3>
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAuthor(paper)
                        setShowAuthorModal(true)
                    }}
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 hover:underline transition-colors text-left"
                >
                    Author: {paper.author_name || 'Unknown'}
                </button>
                <p className="text-sm text-gray-600 dark:text-gray-400">Submitted: {new Date(paper.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {paper.reviews.length} Review{paper.reviews.length !== 1 ? 's' : ''}
                </span>
                <p className="text-lg font-bold text-blue-600">
                    {paper.reviews.length > 0 ? `${getAverageScore(paper.reviews)}/5` : 'No Rating'}
                </p>
            </div>
        </div>

        {paper.abstract && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{paper.abstract}</p>
        )}

        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded">
            <p className="text-sm font-medium mb-2 dark:text-white">Review Summary:</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
                {paper.reviews.length > 0 ? getRecommendationSummary(paper.reviews) : 'No reviews submitted yet.'}
            </p>
        </div>
    </div>
)
