import { Button, Text, TextInput, IconButton, VisibleIcon, HiddenIcon } from '@0xsequence/design-system'
import { ChangeEvent, useState } from 'react'

interface MnemonicInputGridProps {
    wordCount?: 12 | 24
    onMnemonicChange?: (mnemonic: string) => void
    value?: string[]
}

export const MnemonicInputGrid = ({
    wordCount: initialWordCount = 12,
    onMnemonicChange,
    value = []
}: MnemonicInputGridProps) => {
    const [wordCount, setWordCount] = useState<12 | 24>(initialWordCount)
    const [words, setWords] = useState<string[]>(
        value.length > 0 ? value : Array(wordCount).fill('')
    )
    const [isVisible, setIsVisible] = useState(false)

    const handlePaste = (index: number, pastedText: string) => {
        // Split by common separators: spaces, newlines, tabs, commas
        const pastedWords = pastedText
            .split(/[\s,]+/)
            .map(word => word.trim())
            .filter(word => word.length > 0)

        // If only one word is pasted, treat it as normal input
        if (pastedWords.length === 1) {
            handleWordChange(index, pastedWords[0])
            return
        }

        // Auto-switch word count only if exactly 12 or 24 words are pasted
        let targetWordCount: 12 | 24 = wordCount
        if (pastedWords.length === 24) {
            targetWordCount = 24
        } else if (pastedWords.length === 12) {
            targetWordCount = 12
        }

        // Adjust word count if needed
        if (targetWordCount !== wordCount) {
            setWordCount(targetWordCount)
        }

        // Fill the words array
        const newWords = Array(targetWordCount).fill('')
        for (let i = 0; i < Math.min(pastedWords.length, targetWordCount); i++) {
            newWords[i] = pastedWords[i]
        }

        setWords(newWords)

        if (onMnemonicChange) {
            onMnemonicChange(newWords.join(' '))
        }
    }

    const handleWordChange = (index: number, value: string) => {
        const newWords = [...words]
        newWords[index] = value.trim()
        setWords(newWords)

        if (onMnemonicChange) {
            onMnemonicChange(newWords.join(' '))
        }
    }

    const handleWordCountChange = (count: 12 | 24) => {
        setWordCount(count)
        const newWords = Array(count).fill('')
        if (count > wordCount) {
            for (let i = 0; i < Math.min(words.length, count); i++) {
                newWords[i] = words[i]
            }
        } else {
            for (let i = 0; i < count; i++) {
                newWords[i] = words[i] || ''
            }
        }
        setWords(newWords)

        if (onMnemonicChange) {
            onMnemonicChange(newWords.join(' '))
        }
    }

    return (
        <div className='flex flex-col gap-4'>
            <div className='flex flex-col sm:flex-row gap-2 items-center rounded-md p-2 w-full sm:w-fit'>
                <Button
                    shape="square"
                    variant={wordCount === 12 ? 'primary' : "secondary"}
                    size="xs"
                    onClick={() => handleWordCountChange(12)}
                >
                    <Text className='px-4' variant="small" color={wordCount === 12 ? 'text100' : 'text50'}>12 Words</Text>
                </Button>

                <Button
                    shape="square"
                    variant={wordCount === 24 ? 'primary' : "secondary"}
                    size="xs"
                    onClick={() => handleWordCountChange(24)}
                >
                    <Text className='px-4' variant="small" color={wordCount === 24 ? 'text100' : 'text50'}>24 Words</Text>
                </Button>
            </div>

            <div className='flex flex-col gap-2'>
                <div className='flex flex-row justify-end items-center gap-2'>
                    <Text variant="small" color="text50">
                        {isVisible ? 'Hide' : 'Show'}
                    </Text>

                    <IconButton
                        icon={isVisible ? HiddenIcon : VisibleIcon}
                        onClick={() => setIsVisible(!isVisible)}
                        size="xs"
                        variant="text"
                    />
                </div>
                <div className='grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2'>
                    {Array.from({ length: wordCount }).map((_, wordIndex) => (
                        <div key={wordIndex} className='flex flex-col gap-1 relative'>
                            <p className='text-center text-primary/30 font-bold absolute top-1/2 left-4 -translate-x-1/2 -translate-y-1/2 z-10 text-sm pointer-events-none'>
                                {wordIndex + 1}
                            </p>

                            <TextInput
                                name={`word-${wordIndex}`}
                                autoFocus={wordIndex === 0}
                                value={words[wordIndex] || ''}
                                onChange={(ev: ChangeEvent<HTMLInputElement>) =>
                                    handleWordChange(wordIndex, ev.target.value)
                                }
                                onPaste={(ev: React.ClipboardEvent<HTMLInputElement>) => {
                                    ev.preventDefault()
                                    const pastedText = ev.clipboardData.getData('text')
                                    handlePaste(wordIndex, pastedText)
                                }}
                                className='bg-background-raised w-full h-12 py-3.5 px-6 rounded-lg text-primary text-center'
                                style={{
                                    WebkitTextSecurity: !isVisible && words[wordIndex] ? 'disc' : 'none',
                                    paddingLeft: 40
                                } as React.CSSProperties}
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div >
    )
}
