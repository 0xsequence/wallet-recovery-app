import { Box, Button, Text, TextInput, IconButton, VisibleIcon, HiddenIcon } from '@0xsequence/design-system'
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

    const rows = wordCount === 12 ? 3 : 6
    const cols = 4

    return (
        <Box flexDirection="column" gap="4">
            <Box borderRadius="md" padding="2" width="fit" flexDirection="row" gap="2" alignItems="center" background="backgroundMuted">
                <Button
                    shape="square"
                    variant={wordCount === 12 ? 'primary' : 'glass'}
                    label="12 Words"
                    size="xs"
                    onClick={() => handleWordCountChange(12)}
                />
                <Button
                    shape="square"
                    variant={wordCount === 24 ? 'primary' : 'glass'}
                    label="24 Words"
                    size="xs"
                    onClick={() => handleWordCountChange(24)}
                />
            </Box>

            <Box
                flexDirection="column"
                gap="2"
            >
                <Box flexDirection="row" justifyContent="flex-end" alignItems="center" gap="2">
                    <Text variant="small" color="text50">
                        {isVisible ? 'Hide' : 'Show'}
                    </Text>
                    <IconButton
                        icon={isVisible ? HiddenIcon : VisibleIcon}
                        onClick={() => setIsVisible(!isVisible)}
                        size="xs"
                        variant="glass"
                    />
                </Box>
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <Box key={rowIndex} flexDirection="row" gap="2">
                        {Array.from({ length: cols }).map((_, colIndex) => {
                            const wordIndex = rowIndex * cols + colIndex
                            return (
                                <Box key={wordIndex} flexDirection="column" gap="1" style={{ flex: 1 }}>
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
                                        placeholder={`Word ${wordIndex + 1}`}
                                        style={{
                                            WebkitTextSecurity: !isVisible && words[wordIndex] ? 'disc' : 'none',
                                            transition: 'all 0.2s ease'
                                        } as React.CSSProperties}
                                    />
                                </Box>
                            )
                        })}
                    </Box>
                ))}
            </Box>
        </Box >
    )
}
