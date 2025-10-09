#!/bin/bash

echo "🚀 Setting up HR Config Database Tables..."
echo ""

# Run the migration
echo "📦 Running database migration..."
alembic upgrade head

if [ $? -eq 0 ]; then
    echo "✅ Migration completed successfully!"
    echo ""
    echo "🎉 Setup complete! Now restart your backend server."
    echo ""
    echo "To start the backend, run:"
    echo "  python main.py"
    echo ""
else
    echo "❌ Migration failed. Please check the error above."
    exit 1
fi

