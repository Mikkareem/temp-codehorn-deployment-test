import { Problem } from '../types';

export const PROBLEMS: Problem[] = [
  {
    id: '1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'Easy',
    category: 'Algorithms / Arrays',
    acceptanceRate: 51.5,
    description: `Given an array of integers \`nums\` and an integer \`target\`, return *indices of the two numbers such that they add up to \`target\`*.

You may assume that each input would have ***exactly* one solution**, and you may not use the *same* element twice.

You can return the answer in any order.`,
    examples: [
      {
        id: 1,
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        id: 2,
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]'
      },
      {
        id: 3,
        input: 'nums = [3,3], target = 6',
        output: '[0,1]'
      }
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.'
    ],
    hints: [
      'A really brute force way would be to search for all possible pairs of numbers but that would be too slow. Can you think of a way to do it in linear time complexity?',
      'Try using a hash map to map each value to its index. When we look at a number x, we can check if target - x is already in our map!'
    ],
    editorial: `### Approach 1: Brute Force
The brute force approach is simple. Loop through each element $x$ and find if there is another value that equals to $target - x$.

- **Time Complexity:** $O(n^2)$
- **Space Complexity:** $O(1)$

### Approach 2: Two-Pass Hash Map
To improve our runtime complexity, we need a more efficient way to check if the complement exists in the array. If the complement exists, we need to look up its index. A hash map is the most efficient way to map key to index.

- **Time Complexity:** $O(n)$
- **Space Complexity:** $O(n)$

### Approach 3: One-Pass Hash Map
While we iterate and insert elements into the table, we can also look back to check if current element's complement already exists in the table. If it exists, we have found the solution and return immediately!

\`\`\`javascript
function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (map.has(complement)) {
            return [map.get(complement), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
\`\`\`
`,
    solutionApproaches: [
      'Brute Force - O(N^2) Time, O(1) Space',
      'Two-Pass Hash Map - O(N) Time, O(N) Space',
      'One-Pass Hash Map - O(N) Time, O(N) Space (Optimal)'
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
    // Write your code here
    
};`,
      python: `class Solution:
    def twoSum(self, nums: List[int], target: int) -> List[int]:
        # Write your code here
        pass`,
      cpp: `class Solution {
public:
    vector<int> twoSum(vector<int>& nums, int target) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {
        // Write your code here
        return new int[]{};
    }
}`
    },
    testcases: [
      { id: '1-1', input: '[2,7,11,15]\n9', expectedOutput: '[0,1]', isSample: true },
      { id: '1-2', input: '[3,2,4]\n6', expectedOutput: '[1,2]', isSample: true },
      { id: '1-3', input: '[3,3]\n6', expectedOutput: '[0,1]', isSample: true },
      { id: '1-4', input: '[5,2,1,10,18,3]\n13', expectedOutput: '[3,5]', isSample: false }
    ]
  },
  {
    id: '2',
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'Easy',
    category: 'Algorithms / Stack',
    acceptanceRate: 40.8,
    description: `Given a string \`s\` containing just the characters \`'\('\`, \`'\)'\`, \`'\{'\`, \`'\}'\`, \`'\['\` and \`'\]'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      {
        id: 1,
        input: 's = "()"',
        output: 'true'
      },
      {
        id: 2,
        input: 's = "()[]{}"',
        output: 'true'
      },
      {
        id: 3,
        input: 's = "(]"',
        output: 'false'
      },
      {
        id: 4,
        input: 's = "([])"',
        output: 'true'
      }
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      `s consists of parentheses only: '()[]{}'`
    ],
    hints: [
      'Use a stack to keep track of the most recent open bracket.',
      'When you encounter a closing bracket, check if the top of the stack has the matching open bracket. If it does, pop it and continue; otherwise, it is invalid.'
    ],
    editorial: `### Stack Approach
We can utilize a stack data structure to evaluate parentheses structure:

1. Initialize a stack.
2. Iterate through each character in the string:
   - If the character is an opening bracket \`('\`, \`'{'\`, or \`'['\`, push it onto the stack.
   - If it is a closing bracket, check if the stack is empty. If it is, the string is invalid. Otherwise, pop the top of the stack and check if the brackets match.
3. If the stack is empty at the end, the string is valid. Else, some open brackets were left unclosed.

### Complexity
- **Time Complexity:** $O(N)$ since we traverse the string of length $N$ exactly once.
- **Space Complexity:** $O(N)$ as we can push all opening brackets to the stack in the worst-case scenario (e.g. \`"(((("\`).
`,
    solutionApproaches: [
      'Stack-based Validation - O(N) Time, O(N) Space'
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
    // Write your code here
    
};`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        # Write your code here
        pass`,
      cpp: `class Solution {
public:
    bool isValid(string s) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public boolean isValid(string s) {
        // Write your code here
        return false;
    }
}`
    },
    testcases: [
      { id: '2-1', input: '"()"', expectedOutput: 'true', isSample: true },
      { id: '2-2', input: '"()[]{}"', expectedOutput: 'true', isSample: true },
      { id: '2-3', input: '"(]"', expectedOutput: 'false', isSample: true },
      { id: '2-4', input: '"([])"', expectedOutput: 'true', isSample: false },
      { id: '2-5', input: '"([)]"', expectedOutput: 'false', isSample: false }
    ]
  },
  {
    id: '3',
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'Medium',
    category: 'Algorithms / Sliding Window',
    acceptanceRate: 34.2,
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

A **substring** is a contiguous non-empty sequence of characters within a string.`,
    examples: [
      {
        id: 1,
        input: 's = "abcabcbb"',
        output: '3',
        explanation: 'The answer is "abc", with the length of 3.'
      },
      {
        id: 2,
        input: 's = "bbbbb"',
        output: '1',
        explanation: 'The answer is "b", with the length of 1.'
      },
      {
        id: 3,
        input: 's = "pwwkew"',
        output: '3',
        explanation: 'The answer is "wke", with the length of 3. Note that the answer must be a substring, "pwke" is a subsequence and not a substring.'
      }
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.'
    ],
    hints: [
      'Think about using a sliding window with two pointers representing the left and right boundaries.',
      'Maintain a set or map of characters inside the current window. If you see a character already in the set, move the left boundary until the repeated character is expelled.'
    ],
    editorial: `### Approach: Sliding Window
We can define a sliding window $(i, j)$ with two pointers. As we slide $j$ onwards, we maintain a set of seen characters.
If $s[j]$ has been seen in our set, we repeatedly shrink the window from the left ($i++$) and remove $s[i]$ from the set until $s[j]$ is unique.
Then, we update our maximum length record.

\`\`\`javascript
function lengthOfLongestSubstring(s) {
    let maxLen = 0;
    let i = 0;
    const set = new Set();
    for (let j = 0; j < s.length; j++) {
        while (set.has(s[j])) {
            set.delete(s[i]);
            i++;
        }
        set.add(s[j]);
        maxLen = Math.max(maxLen, j - i + 1);
    }
    return maxLen;
}
\`\`\`

- **Time Complexity:** $O(N)$ where $N$ is the number of characters.
- **Space Complexity:** $O(min(M, N))$ where $M$ is the character alphabet size.
`,
    solutionApproaches: [
      'Brute Force Check Substrings - O(N^3) Time, O(min(A, N)) Space',
      'Sliding Window with HashSet - O(N) Time, O(min(A, N)) Space (Optimal)'
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
function lengthOfLongestSubstring(s) {
    // Write your code here
    
};`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        # Write your code here
        pass`,
      cpp: `class Solution {
public:
    int lengthOfLongestSubstring(string s) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {
        // Write your code here
        return 0;
    }
}`
    },
    testcases: [
      { id: '3-1', input: '"abcabcbb"', expectedOutput: '3', isSample: true },
      { id: '3-2', input: '"bbbbb"', expectedOutput: '1', isSample: true },
      { id: '3-3', input: '"pwwkew"', expectedOutput: '3', isSample: true },
      { id: '3-4', input: '""', expectedOutput: '0', isSample: false },
      { id: '3-5', input: '"au"', expectedOutput: '2', isSample: false }
    ]
  },
  {
    id: '4',
    title: 'Container With Most Water',
    slug: 'container-with-most-water',
    difficulty: 'Medium',
    category: 'Algorithms / Two Pointers',
    acceptanceRate: 54.1,
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the \`i\`th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water.

Return *the maximum amount of water a container can store*.

**Notice** that you may not slant the container.`,
    examples: [
      {
        id: 1,
        input: 'height = [1,8,6,2,5,4,8,3,7]',
        output: '49',
        explanation: 'The vertical lines are represented by array [1,8,6,2,5,4,8,3,7]. In this case, the max area of water (shaded area) the container can contain is 49.'
      },
      {
        id: 2,
        input: 'height = [1,1]',
        output: '1'
      }
    ],
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4'
    ],
    hints: [
      'Start with two pointers at both ends of the array.',
      'The width is maximum at this point. In order to increase the area, you must move the pointer with the smaller height inwardly.'
    ],
    editorial: `### Approach: Two Pointers
The water area is constrained by the shorter line, i.e.: $Area = min(height[left], height[right]) \\times (right - left)$.

1. Initialize two pointers: \`left = 0\` and \`right = height.length - 1\`.
2. Compute the current area and record the maximum.
3. Move the pointer that points to the shorter bar towards the other because moving the longer bar will never increase the min-height constraint of our container.

- **Time Complexity:** $O(N)$
- **Space Complexity:** $O(1)$
`,
    solutionApproaches: [
      'Brute Force double check - O(N^2) Time, O(1) Space',
      'Two Pointer Shrinking Range - O(N) Time, O(1) Space (Optimal)'
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} height
 * @return {number}
 */
function maxArea(height) {
    // Write your code here
    
};`,
      python: `class Solution:
    def maxArea(self, height: List[int]) -> int:
        # Write your code here
        pass`,
      cpp: `class Solution {
public:
    int maxArea(vector<int>& height) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public int maxArea(int[] height) {
        // Write your code here
        return 0;
    }
}`
    },
    testcases: [
      { id: '4-1', input: '[1,8,6,2,5,4,8,3,7]', expectedOutput: '49', isSample: true },
      { id: '4-2', input: '[1,1]', expectedOutput: '1', isSample: true },
      { id: '4-3', input: '[4,3,2,1,4]', expectedOutput: '16', isSample: false }
    ]
  },
  {
    id: '5',
    title: 'Median of Two Sorted Arrays',
    slug: 'median-of-two-sorted-arrays',
    difficulty: 'Hard',
    category: 'Algorithms / Binary Search',
    acceptanceRate: 38.9,
    description: `Given two sorted arrays \`nums1\` and \`nums2\` of size \`m\` and \`n\` respectively, return **the median** of the two sorted arrays.

The overall run time complexity should be **$O(\\log(m+n))$**.`,
    examples: [
      {
        id: 1,
        input: 'nums1 = [1,3], nums2 = [2]',
        output: '2.00000',
        explanation: 'merged array = [1,2,3] and median is 2.'
      },
      {
        id: 2,
        input: 'nums1 = [1,2], nums2 = [3,4]',
        output: '2.50000',
        explanation: 'merged array = [1,2,3,4] and median is (2 + 3) / 2 = 2.5.'
      }
    ],
    constraints: [
      'nums1.length == m',
      'nums2.length == n',
      '0 <= m <= 1000',
      '0 <= n <= 1000',
      '1 <= m + n <= 2000',
      '-10^6 <= nums1[i], nums2[i] <= 10^6'
    ],
    hints: [
      'Can you think of a way to segment the arrays in two equal-sized left and right parts?',
      'Use Binary Search on the smaller array is standard practice. Find the partition boundary such that everything on the left is smaller or equal to everything on the right.'
    ],
    editorial: `### Binary Search on Partition
To solve in $O(\\log(m+n))$, we partition the smaller array \`nums1\` at index $i$ and array \`nums2\` at index $j$ such that the left half partition has equal element counts as the right half.

We choose $i$ such that:
$$L_1 \\le R_2 \\quad \\text{and} \\quad L_2 \\le R_1$$
where:
- $L_1 = nums1[i-1]$
- $R_1 = nums1[i]$
- $L_2 = nums2[j-1]$
- $R_2 = nums2[j]$

We adjust the search range using binary search. Once partition conditions are met, we return:
- For odd total length: $max(L_1, L_2)$
- For even total length: $(max(L_1, L_2) + min(R_1, R_2)) / 2$

- **Time Complexity:** $O(\\log(\\min(M, N)))$
- **Space Complexity:** $O(1)$
`,
    solutionApproaches: [
      'Merge and Sort - O((M+N) log(M+N)) Time, O(M+N) Space',
      'Two Pointer Merge Walk - O(M+N) Time, O(1) Space',
      'Binary Search on Median Split - O(log(min(M,N))) Time, O(1) Space (Optimal)'
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums1
 * @param {number[]} nums2
 * @return {number}
 */
function findMedianSortedArrays(nums1, nums2) {
    // Write your code here
    
};`,
      python: `class Solution:
    def findMedianSortedArrays(self, nums1: List[int], nums2: List[int]) -> float:
        # Write your code here
        pass`,
      cpp: `class Solution {
public:
    double findMedianSortedArrays(vector<int>& nums1, vector<int>& nums2) {
        // Write your code here
        
    }
};`,
      java: `class Solution {
    public double findMedianSortedArrays(int[] nums1, int[] nums2) {
        // Write your code here
        return 0.0;
    }
}`
    },
    testcases: [
      { id: '5-1', input: '[1,3]\n[2]', expectedOutput: '2.0', isSample: true },
      { id: '5-2', input: '[1,2]\n[3,4]', expectedOutput: '2.5', isSample: true },
      { id: '5-3', input: '[]\n[1]', expectedOutput: '1.0', isSample: false }
    ]
  }
];
